import { forbidden } from '@southneuhof/sprindle'
import type { FileRequestArgs, RouteParameters } from '@southneuhof/sprindle'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../db'
import { requireOrgIdentity } from '../../../identity'
import { users } from '../users/users.table'

export async function piOwnerId() {
  const email = process.env.CARTA_ADMIN_EMAIL ?? 'admin@example.com'
  const owner = (await getDb().select({ id: users.id, status: users.statusCode }).from(users).where(eq(users.email, email)).limit(1))[0]
  return owner?.status === 'active' ? owner.id : null
}

export async function requirePiOwner(args: Pick<FileRequestArgs<RouteParameters, object>, 'c' | 'identity'>) {
  const actor = await requireOrgIdentity(args)
  if (actor.userId !== await piOwnerId()) throw forbidden('Pi is available to the configured owner.')
  return actor
}
