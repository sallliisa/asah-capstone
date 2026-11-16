import { defineRoute } from '@southneuhof/sprindle'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../db'
import { readJsonBody } from '../../../../request-body'
import { requireNotificationOwner } from '../owner'
import { notifications } from '../notifications.table'

const inputSchema = z.object({ id: z.string().min(1).optional() }).strict()
export const POST = defineRoute({ openapi: { requestBody: inputSchema }, action: async (args) => {
  const recipient = await requireNotificationOwner(args)
  const input = inputSchema.parse(await readJsonBody(args.c))
  await getDb().update(notifications).set({ readAt: new Date().toISOString() }).where(and(eq(notifications.recipientId, recipient), isNull(notifications.readAt), input.id ? eq(notifications.id, input.id) : undefined))
  return { ok: true }
} })
