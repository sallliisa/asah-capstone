import { afterAll, expect, it, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { roleAssignments, roles } from '../roles/roles.table'
import { rooms } from '../rooms/rooms.table'
import { users } from '../users/users.table'
import { activities } from '../activities/activities.table'
import { businessDate } from '../activities/dates'
import { activityCategories } from '../activity-categories/activity-categories.table'
import { tenantDetectorPredictions, tenantDetectorPredictionRooms, tenantDetectorState } from './tenant-detector.table'
import { processTenantDetector } from './process'

const tenantIds: string[] = []
const roomIds: string[] = []
const categoryIds: string[] = []
const originalUrl = process.env.MODEL_SERVICE_URL
const originalToken = process.env.MODEL_SERVICE_TOKEN

function request(path: string, method: string, cookie: string, body?: object) {
  return app.request(`/tenant-detector/${path}`, { method, headers: { cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

afterAll(async () => {
  vi.unstubAllGlobals()
  if (originalUrl === undefined) delete process.env.MODEL_SERVICE_URL
  else process.env.MODEL_SERVICE_URL = originalUrl
  if (originalToken === undefined) delete process.env.MODEL_SERVICE_TOKEN
  else process.env.MODEL_SERVICE_TOKEN = originalToken
  if (tenantIds.length) {
    await getDb().delete(tenantDetectorState).where(inArray(tenantDetectorState.tenantId, tenantIds))
    const predictions = await getDb().select({ id: tenantDetectorPredictions.id }).from(tenantDetectorPredictions).where(inArray(tenantDetectorPredictions.tenantId, tenantIds))
    if (predictions.length) await getDb().delete(tenantDetectorPredictionRooms).where(inArray(tenantDetectorPredictionRooms.predictionId, predictions.map((row) => row.id)))
    await getDb().delete(tenantDetectorPredictions).where(inArray(tenantDetectorPredictions.tenantId, tenantIds))
    await getDb().delete(activities).where(inArray(activities.tenantId, tenantIds))
  }
  if (roomIds.length) await getDb().delete(rooms).where(inArray(rooms.id, roomIds))
  if (categoryIds.length) await getDb().delete(activityCategories).where(inArray(activityCategories.id, categoryIds))
  await closeDb()
})

it('guards tenant finance results and derives assessment history from activity records', async () => {
  const owner = await createSystemSession(['view-users', 'view-activities', 'view-rooms', 'update-users', 'create-activities', 'delete-rooms'], 'detector-owner')
  const occupant = await createSystemSession([], 'detector-tenant')
  tenantIds.push(occupant.userId)
  await getDb().insert(roles).values({ id: 'role-occupant', roleCode: 'occupant', name: 'Occupant', active: true }).onConflictDoNothing()
  await getDb().insert(roleAssignments).values({ userId: occupant.userId, roleId: 'role-occupant' })
  const room = (await getDb().insert(rooms).values({ roomCode: crypto.randomUUID().slice(0, 20), name: 'Detector room', occupantId: occupant.userId }).returning())[0]
  roomIds.push(room.id)
  const limited = await createSystemSession(['view-users'], 'detector-limited')
  expect((await request(`detail/${occupant.userId}`, 'GET', limited.cookie)).status).toBe(403)
  expect((await request(`coverage/${occupant.userId}`, 'PUT', owner.cookie, {})).status).toBe(404)
  const insertedCategories = await getDb().insert(activityCategories).values({ id: 'activity-category-corrective-repairs', name: 'Corrective Repairs' }).onConflictDoNothing().returning()
  categoryIds.push(...insertedCategories.map((row) => row.id))
  const before = (await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, occupant.userId)))[0]
  const created = await app.request('/activities/create', { method: 'POST', headers: { cookie: owner.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Detector source repair', tenantId: occupant.userId, roomId: room.id, categoryId: 'activity-category-corrective-repairs' }) })
  expect(created.status).toBe(201)
  const after = (await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, occupant.userId)))[0]
  expect(after.sourceRevision).toBeGreaterThan(before.sourceRevision)
  expect(after.pending).toBe(true)
  const pastRepair = { tenantId: occupant.userId, roomId: room.id, categoryId: 'activity-category-corrective-repairs', workStatus: 'completed', completedDate: '2000-01-01' }
  const [outsideWindow] = await getDb().insert(activities).values([
    { ...pastRepair, name: 'Old repair' },
    { ...pastRepair, name: 'Old repair paid today', financialKind: 'expense', paymentStatus: 'settled', paymentDate: businessDate(), amount: 50 },
  ]).returning()
  const original = await getDb().select().from(activities).where(eq(activities.tenantId, occupant.userId))
  process.env.MODEL_SERVICE_URL = 'https://model.example.invalid'
  process.env.MODEL_SERVICE_TOKEN = 'test-service-token'
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('service unavailable') }))
  expect(await processTenantDetector()).toMatchObject({ error: 'model_service_unavailable', saved: 0 })
  expect(await getDb().select().from(activities).where(eq(activities.tenantId, occupant.userId))).toEqual(original)
  expect((await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, occupant.userId)))[0].pending).toBe(true)
  let changeDuringScoring = true
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/health')) return Response.json({ ready: true, modelVersion: 'external-test-model', featureVersion: 'tenant-v1' })
    if (changeDuringScoring) await getDb().update(activities).set({ name: 'Source changed during scoring' }).where(eq(activities.tenantId, occupant.userId))
    return Response.json({ results: [{ tenantId: occupant.userId, asOfDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), windowStart: '2025-12-01', observedDays: 300, featureVersion: 'tenant-v1', modelVersion: 'external-test-model', eligibilityReasons: ['less_than_3_due_rents'], features: null, facts: [], grade: null, score: null }] })
  }))
  expect(await processTenantDetector()).toMatchObject({ saved: 0 })
  expect(await getDb().select().from(tenantDetectorPredictions).where(eq(tenantDetectorPredictions.tenantId, occupant.userId))).toHaveLength(0)
  expect((await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, occupant.userId)))[0].pending).toBe(true)
  changeDuringScoring = false
  await getDb().update(tenantDetectorState).set({ lastAttempt: null }).where(eq(tenantDetectorState.tenantId, occupant.userId))
  expect(await processTenantDetector()).toMatchObject({ saved: 1 })
  const persisted = (await getDb().select().from(tenantDetectorPredictions).where(eq(tenantDetectorPredictions.tenantId, occupant.userId)))[0]
  expect(persisted.tenantId).toBe(occupant.userId)
  const relevantIds = original.map((activity) => activity.id).filter((id) => id !== outsideWindow.id).sort()
  const windowStart = new Date(`${persisted.asOfDate}T00:00:00.000Z`)
  const month = windowStart.getUTCMonth()
  windowStart.setUTCFullYear(windowStart.getUTCFullYear() - 1)
  if (windowStart.getUTCMonth() === month) windowStart.setUTCDate(windowStart.getUTCDate() + 1)
  const earliestDate = windowStart.toISOString().slice(0, 10)
  expect(persisted.input).toMatchObject({
    observationStart: earliestDate,
    coverage: { repairsFrom: earliestDate, cleaningFrom: earliestDate, rentFrom: earliestDate, repairCostsComplete: true },
    activities: relevantIds.map((id) => ({ id })),
  })
  expect((await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, occupant.userId)))[0]).toMatchObject({ pending: false, latestPredictionId: persisted.id })
  vi.useFakeTimers({ toFake: ['Date'] })
  try {
    vi.setSystemTime(new Date(`${persisted.asOfDate}T17:05:00.000Z`))
    const detail = await request(`detail/${occupant.userId}`, 'GET', owner.cookie)
    const list = await request('list', 'GET', owner.cookie)
    expect(await detail.json()).toMatchObject({ data: { stale: false, state: { pending: false } } })
    expect(await list.json()).toMatchObject({ data: expect.arrayContaining([expect.objectContaining({ tenantId: occupant.userId, stale: false, pending: false })]) })
  } finally { vi.useRealTimers() }
  const successfulFetch = globalThis.fetch
  expect((await request(`refresh/${occupant.userId}`, 'POST', owner.cookie)).status).toBe(202)
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('service unavailable') }))
  await processTenantDetector()
  expect((await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, occupant.userId)))[0]).toMatchObject({ pending: true, latestPredictionId: persisted.id })
  vi.stubGlobal('fetch', successfulFetch)
  vi.useFakeTimers({ toFake: ['Date'] })
  try {
    vi.setSystemTime(new Date('2040-01-01T05:00:00.000Z'))
    await getDb().update(users).set({ statusCode: 'non_active' }).where(eq(users.id, occupant.userId))
    await getDb().update(tenantDetectorState).set({ pending: false, lastAttempt: null, dailyDate: '2000-01-01' }).where(eq(tenantDetectorState.tenantId, occupant.userId))
    expect(await processTenantDetector()).toMatchObject({ saved: 1 })
    expect((await getDb().select().from(tenantDetectorState).where(eq(tenantDetectorState.tenantId, occupant.userId)))[0].dailyDate).toBe('2040-01-01')
  } finally { vi.useRealTimers() }
  await getDb().delete(activities).where(eq(activities.tenantId, occupant.userId))
  const removeRoom = await app.request(`/rooms/delete/${room.id}`, { method: 'DELETE', headers: { cookie: owner.cookie } })
  expect(removeRoom.status).toBe(409)
  expect((await getDb().select().from(rooms).where(eq(rooms.id, room.id)))[0].id).toBe(room.id)
})
