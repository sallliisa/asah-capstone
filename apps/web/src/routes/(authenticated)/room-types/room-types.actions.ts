import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { roomTypesQuerySchema } from './room-types.schema'

export const roomTypesActions = createHonoResourceActions(rpc['room-types'], { querySchema: roomTypesQuerySchema })
