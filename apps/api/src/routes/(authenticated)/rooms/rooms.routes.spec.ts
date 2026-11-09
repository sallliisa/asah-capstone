import { afterAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { rooms } from './rooms.table'
import { roleAssignments } from '../roles/roles.table'

const createdIds: string[] = []
const code = `room-${crypto.randomUUID().slice(0, 8)}`

function request(path: string, method: string, cookie?: string, body?: object) {
  return app.request(`/rooms/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  })
}

afterAll(async () => {
  if (createdIds.length) await getDb().delete(rooms).where(inArray(rooms.id, createdIds))
  await closeDb()
})

describe('Room master data', () => {
  it('stores normalized values, rejects duplicate codes, and persists edits and deletion', async () => {
    const actor = await createSystemSession(['view-rooms', 'create-rooms', 'update-rooms', 'delete-rooms'], 'rooms')
    const created = await request('create', 'POST', actor.cookie, { roomCode: ` ${code} `, name: ' Room One ', description: ' ' })
    expect(created.status).toBe(201)
    const stored = (await getDb().select().from(rooms).where(eq(rooms.roomCode, code)))[0]
    expect(stored).toBeDefined()
    createdIds.push(stored.id)
    expect(stored).toMatchObject({ name: 'Room One', description: null, createdByUserId: actor.userId })
    expect((await request('create', 'POST', actor.cookie, { roomCode: code, name: 'Duplicate' })).status).toBe(400)
    expect(await getDb().select().from(rooms).where(eq(rooms.roomCode, code))).toHaveLength(1)
    expect((await request(`detail/${stored.id}`, 'GET', actor.cookie)).status).toBe(200)
    expect((await request(`update/${stored.id}`, 'PATCH', actor.cookie, { name: ' Room Two ' })).status).toBe(200)
    expect((await getDb().select().from(rooms).where(eq(rooms.id, stored.id)))[0]).toMatchObject({ name: 'Room Two', updatedByUserId: actor.userId })
    expect((await request(`delete/${stored.id}`, 'DELETE', actor.cookie)).status).toBe(200)
    expect(await getDb().select().from(rooms).where(eq(rooms.id, stored.id))).toHaveLength(0)
  })

  it('offers only occupants, rejects other users, and supports assignment and clearing', async () => {
    const manager = await createSystemSession(['view-rooms', 'create-rooms', 'update-rooms'], 'room-manager')
    const occupant = await createSystemSession([], 'room-occupant')
    await getDb().insert(roleAssignments).values({ userId: occupant.userId, roleId: 'role-occupant' })
    const choices = await request('occupants', 'GET', manager.cookie)
    expect(choices.status).toBe(200)
    const options = await choices.json()
    expect(options.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: occupant.userId })]))
    expect(options.data).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: manager.userId })]))
    const roomCode = `assign-${crypto.randomUUID().slice(0, 8)}`
    const invalid = await request('create', 'POST', manager.cookie, { roomCode, name: 'Assignment', occupantId: manager.userId })
    expect(invalid.status).toBe(400)
    expect(await getDb().select().from(rooms).where(eq(rooms.roomCode, roomCode))).toHaveLength(0)
    const created = await request('create', 'POST', manager.cookie, { roomCode, name: 'Assignment', occupantId: occupant.userId })
    expect(created.status).toBe(201)
    const row = (await getDb().select().from(rooms).where(eq(rooms.roomCode, roomCode)))[0]
    createdIds.push(row.id)
    expect(row).toMatchObject({ occupantId: occupant.userId, roomTypeId: 'room-type-standard' })
    const detail = await (await request(`detail/${row.id}`, 'GET', manager.cookie)).json()
    expect(detail.data).toMatchObject({ occupantId: occupant.userId, occupantName: 'room-occupant Test User', roomTypeName: 'Standard' })
    expect((await request(`update/${row.id}`, 'PATCH', manager.cookie, { occupantId: manager.userId })).status).toBe(400)
    expect((await getDb().select().from(rooms).where(eq(rooms.id, row.id)))[0].occupantId).toBe(occupant.userId)
    expect((await request(`update/${row.id}`, 'PATCH', manager.cookie, { occupantId: null })).status).toBe(200)
    expect((await getDb().select().from(rooms).where(eq(rooms.id, row.id)))[0].occupantId).toBeNull()
    await getDb().delete(roleAssignments).where(eq(roleAssignments.userId, occupant.userId))
  })

  it('requires the room permission at each route', async () => {
    const limited = await createSystemSession([], 'rooms-denied')
    for (const [path, method] of [['list', 'GET'], ['occupants', 'GET'], ['room-types', 'GET'], ['detail/missing', 'GET'], ['create', 'POST'], ['update/missing', 'PATCH'], ['delete/missing', 'DELETE']]) {
      expect((await request(path, method)).status).toBe(401)
      expect((await request(path, method, limited.cookie, { roomCode: 'Denied', name: 'Denied' })).status).toBe(403)
    }
  })
})
