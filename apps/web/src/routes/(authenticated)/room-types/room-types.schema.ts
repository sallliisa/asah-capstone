import { roomTypeCreateSchema, roomTypeSelectSchema, roomTypeUpdateSchema } from '@southneuhof/api/src/routes/(authenticated)/room-types/schema.ts'
import { z } from 'zod/v4'
import { collectionQueryFields } from '@/framework/hono/collectionQuery'
import { rpc } from '@/framework/rpc'
import { checkedHonoCreateSchema, checkedHonoRecordSchema, checkedHonoUpdateSchema } from '@/framework/schema'

export const roomTypesRecordSchema = checkedHonoRecordSchema(rpc['room-types'], roomTypeSelectSchema)
export const roomTypesCreateSchema = checkedHonoCreateSchema(rpc['room-types'], roomTypeCreateSchema)
export const roomTypesUpdateSchema = checkedHonoUpdateSchema(rpc['room-types'], roomTypeUpdateSchema)
export const roomTypesQuerySchema = z.object({ ...collectionQueryFields, sort_by: z.enum(['name', 'cost']).optional() })
