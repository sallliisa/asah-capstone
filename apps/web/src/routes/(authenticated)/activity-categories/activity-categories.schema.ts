import { activityCategoryCreateSchema, activityCategorySelectSchema, activityCategoryUpdateSchema } from '@southneuhof/api/src/routes/(authenticated)/activity-categories/schema.ts'
import { z } from 'zod/v4'
import { collectionQueryFields } from '@/framework/hono/collectionQuery'
import { rpc } from '@/framework/rpc'
import { checkedHonoCreateSchema, checkedHonoRecordSchema, checkedHonoUpdateSchema } from '@/framework/schema'

export const activityCategoriesRecordSchema = checkedHonoRecordSchema(rpc['activity-categories'], activityCategorySelectSchema)
export const activityCategoriesCreateSchema = checkedHonoCreateSchema(rpc['activity-categories'], activityCategoryCreateSchema)
export const activityCategoriesUpdateSchema = checkedHonoUpdateSchema(rpc['activity-categories'], activityCategoryUpdateSchema)
export const activityCategoriesQuerySchema = z.object({ ...collectionQueryFields, sort_by: z.enum(['name', 'createdAt']).optional() })
