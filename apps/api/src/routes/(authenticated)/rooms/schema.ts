import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod/v4'
import { optionalText } from '../../../schema'
import { rooms } from './rooms.table'

const write = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const fields = {
  roomCode: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  description: optionalText(1000),
  occupantId: z.string().trim().min(1).nullable().optional(),
  roomTypeId: z.string().trim().min(1).optional(),
}

export const roomCreateSchema = createInsertSchema(rooms, fields).omit(write)
export const roomUpdateSchema = createUpdateSchema(rooms, fields).omit(write).partial()
export const roomSelectSchema = createSelectSchema(rooms)

export const roomPublicSchema = roomSelectSchema.extend({ occupantName: z.string().nullable(), roomTypeName: z.string() })
