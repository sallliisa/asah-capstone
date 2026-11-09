import { createEntity } from '@southneuhof/sprindle/entity'
import { activityCategoryCreateSchema, activityCategorySelectSchema, activityCategoryUpdateSchema } from './schema'
import { activityCategories } from './activity-categories.table'

export const activityCategory = createEntity({ table: activityCategories, schemas: { create: activityCategoryCreateSchema, update: activityCategoryUpdateSchema, select: activityCategorySelectSchema } })
