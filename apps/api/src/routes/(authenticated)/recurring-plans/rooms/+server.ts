import { defineRoute } from '@southneuhof/sprindle'
import { asc } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { rooms } from '../../rooms/rooms.table'

export const GET = defineRoute({
  authorize: requirePermission('view-recurring-plans'),
  action: async () => {
    const rows = await getDb().select({ id: rooms.id, roomCode: rooms.roomCode, name: rooms.name }).from(rooms).orderBy(asc(rooms.roomCode))
    const data = rows.map((room) => ({ id: room.id, name: `${room.roomCode} · ${room.name}` }))
    return { data, total: data.length }
  },
})
