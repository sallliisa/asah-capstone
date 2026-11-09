import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { roomsQuerySchema } from './rooms.schema'

const api = createHonoResourceActions(rpc.rooms, { querySchema: roomsQuerySchema })

export const roomsActions = {
  list: api.list,
  occupants: api.occupants,
  roomTypes: api['room-types'],
  detail: api.detail,
  create: api.create,
  update: api.update,
  delete: api.delete,
}
