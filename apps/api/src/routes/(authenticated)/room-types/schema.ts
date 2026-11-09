import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod/v4'
import { roomTypes } from './room-types.table'

const audit = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const fields = { name: z.string().trim().min(1).max(100), cost: z.number().int().min(0).max(2147483647) }
export const roomTypeCreateSchema = createInsertSchema(roomTypes, fields).omit(audit)
export const roomTypeUpdateSchema = createUpdateSchema(roomTypes, fields).omit(audit).partial()
export const roomTypeSelectSchema = createSelectSchema(roomTypes)
