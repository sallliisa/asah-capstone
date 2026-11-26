import { defineRoute, forbidden } from '@southneuhof/sprindle'
import { asc, eq } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requireOrgIdentity, requirePermission } from '../../../../identity'
import { rooms } from '../../rooms/rooms.table'

export const GET = defineRoute({
  authorize: requirePermission('create-issue-reports'),
  action: async (args) => {
    const actor = await requireOrgIdentity(args)
    if (!actor.roleCodes.includes('occupant')) throw forbidden('Only occupants can submit an issue report.')
    const rows = await getDb().select({ id: rooms.id, roomCode: rooms.roomCode, name: rooms.name }).from(rooms)
      .where(eq(rooms.occupantId, actor.userId)).orderBy(asc(rooms.roomCode))
    const data = rows.map(({ id, roomCode, name }) => ({ id, name: `${roomCode} · ${name}` }))
    return { data, total: data.length }
  },
})
