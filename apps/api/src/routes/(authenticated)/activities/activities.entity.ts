import { createEntity } from '@southneuhof/sprindle/entity'
import { activityCreateSchema, activityUpdateSchema, activitySelectSchema } from './schema'
import { activities } from './activities.table'

export const activity = createEntity({ table: activities, schemas: { create: activityCreateSchema, update: activityUpdateSchema, select: activitySelectSchema } })
