import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { activityCategoriesQuerySchema } from './activity-categories.schema'

export const activityCategoriesActions = createHonoResourceActions(rpc['activity-categories'], { querySchema: activityCategoriesQuerySchema })
