import { validateActivityCategory } from '../../activity-categories/references'
import { create } from '@southneuhof/sprindle'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { validateRoom } from '../../../../room-reference'
import { activities } from '../activities.table'
import { businessDate } from '../dates'
import { activityInsertSchema, activityStateSchema } from '../schema'

export const POST = create({
  authorize: requirePermission('create-activities'),
  validate: [({ state }) => validateRoom(state.input.roomId), ({ state }) => validateActivityCategory(state.input.categoryId)],
  run: async ({ state }) => {
    const values = { ...state.input, ...state.values }
    const today = businessDate()
    const paymentStatus = values.financialKind === 'none' ? null : 'settled'
    const row = activityInsertSchema.parse({
      ...values,
      workStatus: 'completed',
      completedDate: today,
      paymentStatus,
      paymentDate: paymentStatus === 'settled' ? (values.paymentDate ?? today) : values.paymentDate,
    })
    const rows = await getDb().insert(activities).values(row).returning()
    return activityStateSchema.parse(rows[0])
  },
})
