import { defineRoute } from '@southneuhof/sprindle'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../db'
import { readJsonBody } from '../../../../request-body'
import { requireOrgIdentity } from '../../../../identity'
import { pushSubscriptions } from '../notifications.table'
import { pushSubscriptionSchema } from '../schema'

export const GET = defineRoute({ action: async () => ({ publicKey: process.env.WEB_PUSH_PUBLIC_KEY ?? null }) })
export const POST = defineRoute({ openapi: { requestBody: pushSubscriptionSchema }, action: async (args) => {
  const recipientId = (await requireOrgIdentity(args)).userId
  const { session } = z.object({ session: z.object({ id: z.string() }) }).parse(await args.identity())
  const input = pushSubscriptionSchema.parse(await readJsonBody(args.c))
  await getDb().insert(pushSubscriptions).values({ recipientId, sessionId: session.id, endpoint: input.endpoint, ...input.keys }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { recipientId, sessionId: session.id, ...input.keys } })
  return { ok: true, recipientId }
} })
const removeSchema = z.object({ endpoint: z.url() }).strict()
export const DELETE = defineRoute({ openapi: { requestBody: removeSchema }, action: async (args) => {
  const recipientId = (await requireOrgIdentity(args)).userId
  const input = removeSchema.parse(await readJsonBody(args.c))
  await getDb().delete(pushSubscriptions).where(and(eq(pushSubscriptions.recipientId, recipientId), eq(pushSubscriptions.endpoint, input.endpoint)))
  return { ok: true }
} })
