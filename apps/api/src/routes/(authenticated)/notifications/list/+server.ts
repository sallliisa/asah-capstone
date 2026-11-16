import { list } from '@southneuhof/sprindle'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../db'
import { requireNotificationOwner } from '../owner'
import { notifications } from '../notifications.table'

const querySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(10), unread: z.enum(['true', 'false']).optional(), search: z.string().optional(), sort: z.string().optional(), order: z.string().optional() })

export const GET = list({
  run: async (args) => {
    const recipient = await requireNotificationOwner(args)
    const query = querySchema.parse(args.state.query)
    const where = and(eq(notifications.recipientId, recipient), query.unread === 'true' ? isNull(notifications.readAt) : undefined)
    const [data, total] = await Promise.all([
      getDb().select().from(notifications).where(where).orderBy(desc(notifications.createdAt), desc(notifications.id)).limit(query.limit).offset((query.page - 1) * query.limit),
      getDb().select({ value: count() }).from(notifications).where(where),
    ])
    return { data, total: total[0].value }
  },
})
