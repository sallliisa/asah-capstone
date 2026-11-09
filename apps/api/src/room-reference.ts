import { z } from 'zod/v4'
import { eq } from 'drizzle-orm'
import { getDb } from './db'
import { rooms } from './routes/(authenticated)/rooms/rooms.table'

export async function validateRoom(value: unknown) {
  const roomId = z.string().min(1).nullable().optional().parse(value)
  if (roomId && !(await getDb().select({ id: rooms.id }).from(rooms).where(eq(rooms.id, roomId)).limit(1)).length) return { field: 'roomId', message: 'Select an existing room.' }
}
