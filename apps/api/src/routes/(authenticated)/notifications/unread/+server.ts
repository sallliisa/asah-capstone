import { defineRoute } from '@southneuhof/sprindle'
import { and, count, eq, isNull } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requireOrgIdentity } from '../../../../identity'
import { notifications } from '../notifications.table'

export const GET = defineRoute({ action: async (args) => {
  const recipient = (await requireOrgIdentity(args)).userId
  const result = await getDb().select({ unread: count() }).from(notifications).where(and(eq(notifications.recipientId, recipient), isNull(notifications.readAt)))
  return { data: result, total: 1 }
} })
