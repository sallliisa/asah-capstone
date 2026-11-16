import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod/v4'
import { notifications } from './notifications.table'

export const notificationSelectSchema = createSelectSchema(notifications)
export const notificationCreateSchema = createInsertSchema(notifications)
export const notificationUpdateSchema = createUpdateSchema(notifications)
export const pushSubscriptionSchema = z.object({
  endpoint: z.url().refine((value) => new URL(value).protocol === 'https:', 'Push endpoints must use HTTPS.'),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
}).strict()
