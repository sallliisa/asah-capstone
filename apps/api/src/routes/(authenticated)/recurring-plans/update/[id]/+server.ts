import { validateActivityCategory } from '../../../activity-categories/references'
import { update, validationError } from '@southneuhof/sprindle'
import { and, eq, SQL } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requirePermission } from '../../../../../identity'
import { validateRoom } from '../../../../../room-reference'
import { recurringPlans } from '../../recurring-plans.table'
import { recurringPlanStateSchema } from '../../schema'

export const PATCH = update({
  authorize: requirePermission('update-recurring-plans'),
  validate: [({ state }) => validateRoom(state.input.roomId), ({ state }) => validateActivityCategory(state.input.categoryId)],
  run: async ({ state }) => {
    if (state.where !== undefined && !(state.where instanceof SQL)) throw validationError('Unsupported recurring plan scope.')
    const where = and(eq(recurringPlans.id, state.id), state.where)
    return getDb().transaction(async (tx) => {
      const original = (await tx.select().from(recurringPlans).where(where).for('update'))[0]
      if (!original) return undefined
      const merged = recurringPlanStateSchema.parse({ ...original, ...state.input, ...state.values })
      const scheduleChanged = merged.startDate !== original.startDate || merged.intervalCount !== original.intervalCount || merged.intervalUnit !== original.intervalUnit
      if (scheduleChanged && original.occurrenceIndex > 0) throw validationError('This plan has generated activities. Deactivate it and create a new plan to change its schedule.')
      const rows = await tx.update(recurringPlans).set({ ...state.input, ...state.values, ...(scheduleChanged ? { nextOccurrenceDate: merged.startDate } : {}) }).where(where).returning()
      return recurringPlanStateSchema.parse(rows[0])
    })
  },
})
