import { defineRoute } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../identity'
import { activityDashboardQuerySchema } from '../schema'
import { readCashDashboard } from './projection'

export const GET = defineRoute({
  authorize: requirePermission('view-activities'),
  action: async ({ c }) => ({ data: [await readCashDashboard(activityDashboardQuerySchema.parse(c.req.query()))], total: 1 }),
})
