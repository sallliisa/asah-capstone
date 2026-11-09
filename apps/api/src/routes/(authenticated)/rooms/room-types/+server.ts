import { defineRoute } from '@southneuhof/sprindle'
import { asc } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { roomTypes } from '../../room-types/room-types.table'

export const GET = defineRoute({
  authorize: requirePermission('view-rooms'),
  action: async () => {
    const data = await getDb().select({ id: roomTypes.id, name: roomTypes.name }).from(roomTypes).orderBy(asc(roomTypes.name))
    return { data, total: data.length }
  },
})
