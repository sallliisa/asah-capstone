import { createEntity } from '@southneuhof/sprindle/entity'
import { roomCreateSchema, roomSelectSchema, roomUpdateSchema } from './schema'
import { rooms } from './rooms.table'

export const room = createEntity({
  table: rooms,
  schemas: {
    create: roomCreateSchema,
    update: roomUpdateSchema,
    select: roomSelectSchema,
  },
})
