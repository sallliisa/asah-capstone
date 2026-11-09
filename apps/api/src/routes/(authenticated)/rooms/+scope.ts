import { defineScope } from '@southneuhof/sprindle'
import { eq } from 'drizzle-orm'
import { getDb } from '../../../db'
import { roomTypes } from '../room-types/room-types.table'
import { users } from '../users/users.table'
import { room } from './rooms.entity'
import { rooms } from './rooms.table'
import { roomPublicSchema } from './schema'

async function readRoomLabels() {
  return getDb().select({ id: rooms.id, occupantName: users.name, roomTypeName: roomTypes.name }).from(rooms)
    .innerJoin(roomTypes, eq(roomTypes.id, rooms.roomTypeId))
    .leftJoin(users, eq(users.id, rooms.occupantId))
}

export default defineScope({
  entity: room,
  context: () => {
    let labels: ReturnType<typeof readRoomLabels> | undefined
    return { roomLabels: () => labels ??= readRoomLabels() }
  },
  enrich: {
    schema: roomPublicSchema,
    run: async (record, { context }) => {
      const labels = (await context.roomLabels()).find((row) => row.id === record.id)
      return roomPublicSchema.parse({ ...record, occupantName: labels?.occupantName ?? null, roomTypeName: labels?.roomTypeName })
    },
  },
})
