import { defineRoute } from '@southneuhof/sprindle'
import { and, count, eq, isNull } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requireNotificationOwner } from '../owner'
import { notifications } from '../notifications.table'

export const GET = defineRoute({ action: async (args) => {
  const recipient = await requireNotificationOwner(args)
  const result = await getDb().select({ unread: count() }).from(notifications).where(and(eq(notifications.recipientId, recipient), isNull(notifications.readAt)))
  return { data: result, total: 1 }
} })
