import { defineRoute } from '@southneuhof/sprindle'
import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../db'
import { requirePiOwner } from '../owner'
import { piRoutingEvents } from '../pi.table'

export const GET = defineRoute({
  authorize: async (args) => {
    await requirePiOwner(args)
  },
  action: async (args) => {
    const owner = await requirePiOwner(args)
    const page = z.coerce.number().int().positive().default(1).parse(args.c.req.query('page'))
    const where = eq(piRoutingEvents.ownerId, owner.userId)
    const data = await getDb()
      .select()
      .from(piRoutingEvents)
      .where(where)
      .orderBy(desc(piRoutingEvents.createdAt), desc(piRoutingEvents.id))
      .limit(20)
      .offset((page - 1) * 20)
    const total = (await getDb().select({ value: count() }).from(piRoutingEvents).where(where))[0].value
    args.c.header('Cache-Control', 'no-store')
    return { data, total }
  },
})
