import { defineRoute } from '@southneuhof/sprindle'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { pushSubscriptions } from '../../../(authenticated)/notifications/notifications.table'
import { z } from 'zod/v4'
import { getAuth } from '../../../auth/auth'

export const POST = defineRoute({ openapi: { requestBody: z.object({}) }, action: async ({ c }) => {
  const session = await getAuth().api.getSession({ headers: c.req.raw.headers })
  if (session) await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.sessionId, session.session.id))
  return getAuth().handler(c.req.raw)
} })
