import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod/v4'
import { activityCategories } from './activity-categories.table'

const audit = { id: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
const fields = { name: z.string().trim().min(1).max(100) }
export const activityCategoryCreateSchema = createInsertSchema(activityCategories, fields).omit(audit)
export const activityCategoryUpdateSchema = createUpdateSchema(activityCategories, fields).omit(audit).partial()
export const activityCategorySelectSchema = createSelectSchema(activityCategories)
