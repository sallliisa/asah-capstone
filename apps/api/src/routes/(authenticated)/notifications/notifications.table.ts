import { integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from '../users/users.table'
import { activities } from '../activities/activities.table'

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipientId: text('recipient_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  activityId: text('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  readAt: timestamp('read_at', { mode: 'string' }),
}, (table) => [uniqueIndex('notifications_recipient_activity_unique').on(table.recipientId, table.activityId)])

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipientId: text('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  notificationId: text('notification_id').notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscription_id').notNull().references(() => pushSubscriptions.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  attemptedAt: timestamp('attempted_at', { mode: 'string' }),
  error: text('error'),
}, (table) => [uniqueIndex('notification_deliveries_pair_unique').on(table.notificationId, table.subscriptionId)])
