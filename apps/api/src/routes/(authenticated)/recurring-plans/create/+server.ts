import { validateTenant } from '../../../../tenant-reference'
import { validateActivityCategory } from '../../activity-categories/references'
import { create, validationError } from '@southneuhof/sprindle'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { validateRoom } from '../../../../room-reference'
import { recurringPlans } from '../recurring-plans.table'
import { recurringPlanInsertSchema, recurringPlanSelectSchema } from '../schema'

export const POST = create({
  authorize: requirePermission('create-recurring-plans'),
  validate: [({ state }) => validateTenant(state.input.tenantId), ({ state }) => validateRoom(state.input.roomId), ({ state }) => validateActivityCategory(state.input.categoryId)],
  run: async (args) => {
    const { state } = args
    if (state.input.tenantId) await requirePermission('view-users')(args)
    const input = state.input
    if (input.categoryId === 'activity-category-room-rent' && !input.tenantId) throw validationError('Select the tenant for this rent plan.')
    const values = recurringPlanInsertSchema.parse({ ...input, ...state.values, nextOccurrenceDate: input.startDate })
    const rows = await getDb().insert(recurringPlans).values(values).returning()
    return recurringPlanSelectSchema.parse(rows[0])
  },
})
