import { afterAll, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { seedBoardingHouse } from '../../../../scripts/seed-boarding-house'
import { rooms } from '../rooms/rooms.table'
import { roomTypes } from './room-types.table'

const typeIds: string[] = []
const roomIds: string[] = []

function request(path: string, method: string, cookie?: string, body?: object) {
  return app.request(path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

afterAll(async () => {
  if (roomIds.length) await getDb().delete(rooms).where(inArray(rooms.id, roomIds))
  if (typeIds.length) await getDb().delete(roomTypes).where(inArray(roomTypes.id, typeIds))
  await closeDb()
})

it('stores type cost, assigns rooms, and rejects deletion while in use', async () => {
  const manager = await createSystemSession(['view-room-types', 'create-room-types', 'update-room-types', 'delete-room-types', 'create-rooms', 'update-rooms', 'view-rooms'], 'room-types')
  const invalid = await request('/room-types/create', 'POST', manager.cookie, { name: 'Invalid', cost: -1 })
  expect(invalid.status).toBe(400)
  const created = await request('/room-types/create', 'POST', manager.cookie, { name: ' Premium ', cost: 2000000 })
  expect(created.status).toBe(201)
  const payload = await created.json()
  const id = payload.data.id
  typeIds.push(id)
  expect((await getDb().select().from(roomTypes).where(eq(roomTypes.id, id)))[0]).toMatchObject({ name: 'Premium', cost: 2000000 })
  expect((await request(`/room-types/update/${id}`, 'PATCH', manager.cookie, { cost: 2500000 })).status).toBe(200)
  expect((await getDb().select().from(roomTypes).where(eq(roomTypes.id, id)))[0].cost).toBe(2500000)
  const roomCode = `type-${crypto.randomUUID().slice(0, 8)}`
  const roomCreated = await request('/rooms/create', 'POST', manager.cookie, { roomCode, name: 'Typed Room', roomTypeId: id })
  expect(roomCreated.status).toBe(201)
  const room = (await getDb().select().from(rooms).where(eq(rooms.roomCode, roomCode)))[0]
  roomIds.push(room.id)
  expect(room.roomTypeId).toBe(id)
  expect((await request(`/room-types/delete/${id}`, 'DELETE', manager.cookie)).status).toBe(409)
  expect((await getDb().select().from(roomTypes).where(eq(roomTypes.id, id)))[0].cost).toBe(2500000)
  expect((await request(`/rooms/update/${room.id}`, 'PATCH', manager.cookie, { roomTypeId: 'missing-type' })).status).toBe(400)
  expect((await getDb().select().from(rooms).where(eq(rooms.id, room.id)))[0].roomTypeId).toBe(id)
  await seedBoardingHouse()
  await seedBoardingHouse()
  expect((await getDb().select().from(rooms).where(eq(rooms.id, room.id)))[0].roomTypeId).toBe(id)
  expect((await getDb().select().from(roomTypes).where(eq(roomTypes.id, id)))[0].cost).toBe(2500000)
  expect((await request(`/rooms/update/${room.id}`, 'PATCH', manager.cookie, { roomTypeId: 'room-type-standard' })).status).toBe(200)
  expect((await request(`/room-types/delete/${id}`, 'DELETE', manager.cookie)).status).toBe(200)
  expect(await getDb().select().from(roomTypes).where(eq(roomTypes.id, id))).toHaveLength(0)
  expect((await getDb().select().from(rooms).where(eq(rooms.id, room.id)))[0]).toMatchObject({ roomTypeId: 'room-type-standard', occupantId: null })
  expect((await getDb().select().from(roomTypes).where(eq(roomTypes.id, 'room-type-standard')))[0]).toMatchObject({ name: 'Standard', cost: 1500000 })
})

it('requires permission for room type writes and reads', async () => {
  const limited = await createSystemSession([], 'room-types-denied')
  for (const [path, method] of [['list', 'GET'], ['detail/missing', 'GET'], ['create', 'POST'], ['update/missing', 'PATCH'], ['delete/missing', 'DELETE']]) {
    expect((await request(`/room-types/${path}`, method)).status).toBe(401)
    expect((await request(`/room-types/${path}`, method, limited.cookie)).status).toBe(403)
  }
})
