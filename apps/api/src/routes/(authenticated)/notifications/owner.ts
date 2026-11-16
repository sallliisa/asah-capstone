import { forbidden } from '@southneuhof/sprindle'
import { eq } from 'drizzle-orm'
import type { FileRequestArgs, RouteParameters } from '@southneuhof/sprindle'
import { getDb } from '../../../db'
import { requireOrgIdentity } from '../../../identity'
import { users } from '../users/users.table'

export async function notificationOwnerId() {
  const ownerId = process.env.NOTIFICATION_OWNER_USER_ID
  const email = process.env.CARTA_ADMIN_EMAIL
  if (!ownerId && !email) return null
  const owner = (await getDb().select({ id: users.id, status: users.statusCode }).from(users)
    .where(ownerId ? eq(users.id, ownerId) : eq(users.email, email ?? '')).limit(1))[0]
  return owner?.status === 'active' ? owner.id : null
}

export async function requireNotificationOwner(args: Pick<FileRequestArgs<RouteParameters, object>, 'c' | 'identity'>) {
  const actor = await requireOrgIdentity(args)
  if (actor.userId !== await notificationOwnerId()) throw forbidden('Notifications are available to the configured owner.')
  return actor.userId
}
