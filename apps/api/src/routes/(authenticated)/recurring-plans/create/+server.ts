import { validateActivityCategory } from '../../activity-categories/references'
import { create } from '@southneuhof/sprindle'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { validateRoom } from '../../../../room-reference'
import { recurringPlans } from '../recurring-plans.table'
import { recurringPlanCreateSchema, recurringPlanSelectSchema } from '../schema'

export const POST = create({
  authorize: requirePermission('create-recurring-plans'),
  validate: [({ state }) => validateRoom(state.input.roomId), ({ state }) => validateActivityCategory(state.input.categoryId)],
  run: async ({ state }) => {
    const input = recurringPlanCreateSchema.parse(state.input)
    const rows = await getDb().insert(recurringPlans).values({ ...input, ...state.values, nextOccurrenceDate: input.startDate }).returning()
    return recurringPlanSelectSchema.parse(rows[0])
  },
})
