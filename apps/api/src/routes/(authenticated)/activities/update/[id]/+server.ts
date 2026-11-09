import { validateActivityCategory } from '../../../activity-categories/references'
import { update, validationError } from '@southneuhof/sprindle'
import { and, eq, SQL } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requirePermission } from '../../../../../identity'
import { validateRoom } from '../../../../../room-reference'
import { activities } from '../../activities.table'
import { businessDate } from '../../dates'
import { activityStateSchema } from '../../schema'

export const PATCH = update({
  authorize: requirePermission('update-activities'),
  validate: [({ state }) => validateRoom(state.input.roomId), ({ state }) => validateActivityCategory(state.input.categoryId)],
  run: async ({ state }) => {
    if (state.where !== undefined && !(state.where instanceof SQL)) throw validationError('Unsupported activity scope.')
    const where = and(eq(activities.id, state.id), state.where)
    return getDb().transaction(async (tx) => {
      const original = (await tx.select().from(activities).where(where).for('update'))[0]
      if (!original) return undefined
      const values = { ...state.input, ...state.values }
      const merged = { ...original, ...values }
      const today = businessDate()
      const completedDate = merged.workStatus === 'completed' ? (original.completedDate ?? today) : null
      let paymentDate = merged.paymentDate
      if (merged.paymentStatus === 'settled') {
        if (Object.hasOwn(values, 'paymentDate')) paymentDate ??= today
        else if (original.paymentStatus !== 'settled' || original.financialKind !== merged.financialKind) paymentDate = today
      }
      activityStateSchema.parse({ ...merged, completedDate, paymentDate })
      const rows = await tx
        .update(activities)
        .set({ ...values, completedDate, paymentDate })
        .where(where)
        .returning()
      return activityStateSchema.parse(rows[0])
    })
  },
})
