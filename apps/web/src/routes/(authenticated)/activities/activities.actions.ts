import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { activitiesListQuerySchema } from './activities.schema'

export const activitiesActions = createHonoResourceActions(rpc.activities, { querySchema: activitiesListQuerySchema })
