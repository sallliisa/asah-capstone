import { roomCreateSchema, roomPublicSchema, roomSelectSchema, roomUpdateSchema } from '@southneuhof/api/src/routes/(authenticated)/rooms/schema.ts'
import { z } from 'zod/v4'
import { collectionQueryFields } from '@/framework/hono/collectionQuery'
import { rpc } from '@/framework/rpc'
import { checkedHonoCreateSchema, checkedHonoRecordSchema, checkedHonoUpdateSchema } from '@/framework/schema'

export const roomsRecordSchema = checkedHonoRecordSchema(rpc.rooms, roomPublicSchema)
export const roomsCreateSchema = checkedHonoCreateSchema(rpc.rooms, roomCreateSchema.extend({ description: roomSelectSchema.shape.description.optional() }))
export const roomsUpdateSchema = checkedHonoUpdateSchema(rpc.rooms, roomUpdateSchema.extend({ description: roomSelectSchema.shape.description.optional() }))

export const roomsQuerySchema = z.object({
  ...collectionQueryFields,
  sort_by: z.enum(['roomCode', 'name']).optional(),
})
