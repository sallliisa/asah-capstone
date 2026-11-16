import { defineResource, defineTable } from '@southneuhof/loom'
import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { z } from 'zod/v4'
import { collectionQueryFields } from '@/framework/hono/collectionQuery'
import { notificationSelectSchema } from '@southneuhof/api/src/routes/(authenticated)/notifications/schema.ts'

const querySchema = z.object({ ...collectionQueryFields, unread: z.enum(['true', 'false']).optional() })
export const notificationActions = createHonoResourceActions(rpc.notifications, { querySchema })
const table = defineTable({
  schema: notificationSelectSchema,
  columns: {
    title: { label: 'Notification' },
    body: { label: 'Details' },
    createdAt: { label: 'Created', format: 'datetime' },
    readAt: { label: 'Read', format: 'datetime' },
  },
})
export const notifications = defineResource({
  key: 'notifications',
  identity: (record: { id: string }) => record.id,
  list: { permission: 'view-activities', route: { name: 'notifications' }, table: { ...table, load: notificationActions.list } },
})
