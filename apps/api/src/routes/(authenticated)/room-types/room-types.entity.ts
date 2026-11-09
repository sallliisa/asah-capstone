import { createEntity } from '@southneuhof/sprindle/entity'
import { roomTypeCreateSchema, roomTypeSelectSchema, roomTypeUpdateSchema } from './schema'
import { roomTypes } from './room-types.table'

export const roomType = createEntity({ table: roomTypes, schemas: { create: roomTypeCreateSchema, update: roomTypeUpdateSchema, select: roomTypeSelectSchema } })
