import { createEntity } from '@southneuhof/sprindle/entity'
import { notifications } from './notifications.table'
import { notificationCreateSchema, notificationSelectSchema, notificationUpdateSchema } from './schema'

export const notification = createEntity({ table: notifications, schemas: { create: notificationCreateSchema, update: notificationUpdateSchema, select: notificationSelectSchema } })
