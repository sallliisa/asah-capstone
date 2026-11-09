import { eq } from 'drizzle-orm'
import { getDb } from '../../../db'
import { roomTypes } from '../room-types/room-types.table'
import { readOccupants } from './occupants'

export async function validateAssignment(input: { occupantId?: string | null; roomTypeId?: string }) {
  if (input.occupantId && !(await readOccupants(input.occupantId)).length) return { field: 'occupantId', message: 'Select a user with the Occupant role.' }
  if (input.roomTypeId && !(await getDb().select({ id: roomTypes.id }).from(roomTypes).where(eq(roomTypes.id, input.roomTypeId)).limit(1)).length) return { field: 'roomTypeId', message: 'Select an existing room type.' }
}
