import { afterAll, describe, expect, it, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { rooms } from '../rooms/rooms.table'
import { activities } from './activities.table'
import { activityPublicSchema } from './schema'

const activityIds: string[] = []
const roomIds: string[] = []
const prefix = `activity-${crypto.randomUUID().slice(0, 8)}`
const summarySchema = z.object({ data: z.array(z.object({ income: z.number(), expenses: z.number(), net: z.number(), draftCount: z.number() })) })

function request(path: string, method: string, cookie?: string, body?: object) {
  return app.request(`/activities/${path}`, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

async function createActivity(cookie: string, input: object) {
  const response = await request('create', 'POST', cookie, input)
  expect(response.status).toBe(201)
  const record = z.object({ data: activityPublicSchema }).parse(await response.json()).data
  activityIds.push(record.id)
  return record
}

afterAll(async () => {
  if (activityIds.length) await getDb().delete(activities).where(inArray(activities.id, activityIds))
  if (roomIds.length) await getDb().delete(rooms).where(inArray(rooms.id, roomIds))
  await closeDb()
})

describe('Activities', () => {
  it('records manual work as completed and money as settled while preserving follow-up edits', async () => {
    const manager = await createSystemSession(['view-activities', 'create-activities', 'update-activities'], 'activity-state')
    const room = (await getDb().insert(rooms).values({ roomCode: `${prefix}-room`, name: 'Activity Room' }).returning())[0]
    roomIds.push(room.id)
    const cleaning = await createActivity(manager.cookie, { name: `${prefix} cleaning`, roomId: room.id })
    expect(cleaning).toMatchObject({ roomName: room.roomCode, workStatus: 'completed', financialKind: 'none', categoryId: 'activity-category-general', amount: null, paymentStatus: null, paymentDate: null, receipt: null })
    const repair = await createActivity(manager.cookie, { name: `${prefix} repair`, roomId: room.id, financialKind: 'expense', amount: 300000 })
    expect(repair).toMatchObject({ workStatus: 'completed', paymentStatus: 'settled', amount: 300000 })
    expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { workStatus: 'in_progress', paymentStatus: 'draft', amount: null, paymentDate: null })).status).toBe(200)
    expect((await getDb().select().from(activities).where(eq(activities.id, repair.id)))[0]).toMatchObject({ workStatus: 'in_progress', completedDate: null, paymentStatus: 'draft', amount: null, categoryId: 'activity-category-general' })
    expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { paymentStatus: 'settled', amount: 300000, paymentDate: '2030-01-15' })).status).toBe(200)
    expect((await getDb().select().from(activities).where(eq(activities.id, repair.id)))[0]).toMatchObject({ workStatus: 'in_progress', paymentStatus: 'settled', paymentDate: '2030-01-15', updatedByUserId: manager.userId })
    expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { financialKind: 'none' })).status).toBe(400)
    expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { financialKind: 'none', amount: null, paymentStatus: null, paymentDate: null, receipt: null })).status).toBe(200)
    expect((await getDb().select().from(activities).where(eq(activities.id, repair.id)))[0]).toMatchObject({ financialKind: 'none', amount: null, categoryId: 'activity-category-general', workStatus: 'in_progress' })
    for (const input of [
      { financialKind: 'expense', amount: 0 },
      { financialKind: 'expense', amount: null },
      { financialKind: 'none', amount: 1000 },
      { workStatus: 'planned' },
      { paymentStatus: 'draft' },
      { categoryId: 'missing-category' },
    ]) expect((await request('create', 'POST', manager.cookie, { name: `${prefix} invalid`, ...input })).status).toBe(400)
    expect(await getDb().select().from(activities).where(eq(activities.name, `${prefix} invalid`))).toHaveLength(0)
  })

  it('defaults actual dates, preserves history, and rejects client-owned schedule or completion dates', async () => {
    const manager = await createSystemSession(['view-activities', 'create-activities', 'update-activities'], 'activity-dates')
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(new Date('2026-11-09T18:00:00.000Z'))
      const cleaning = await createActivity(manager.cookie, { name: `${prefix} completed cleaning` })
      expect(cleaning).toMatchObject({ completedDate: '2026-11-10', occurrenceDate: null, recurringPlanId: null, paymentDate: null })
      const expense = await createActivity(manager.cookie, { name: `${prefix} bottles`, financialKind: 'expense', amount: 75000 })
      const income = await createActivity(manager.cookie, { name: `${prefix} income`, financialKind: 'income', amount: 1500000 })
      expect(expense).toMatchObject({ completedDate: '2026-11-10', paymentDate: '2026-11-10', paymentStatus: 'settled' })
      expect(income).toMatchObject({ completedDate: '2026-11-10', paymentDate: '2026-11-10', paymentStatus: 'settled' })
      const repair = await createActivity(manager.cookie, { name: `${prefix} pending repair`, financialKind: 'expense', amount: 300000 })
      expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { workStatus: 'in_progress', paymentStatus: 'draft', amount: null, paymentDate: null })).status).toBe(200)
      vi.setSystemTime(new Date('2026-11-10T18:00:00.000Z'))
      expect((await request(`update/${expense.id}`, 'PATCH', manager.cookie, { name: `${prefix} updated bottles` })).status).toBe(200)
      expect((await getDb().select().from(activities).where(eq(activities.id, expense.id)))[0]).toMatchObject({ completedDate: '2026-11-10', paymentDate: '2026-11-10' })
      expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { paymentStatus: 'settled', amount: 300000 })).status).toBe(200)
      expect((await getDb().select().from(activities).where(eq(activities.id, repair.id)))[0]).toMatchObject({ completedDate: null, paymentDate: '2026-11-11' })
      expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { workStatus: 'completed' })).status).toBe(200)
      expect((await getDb().select().from(activities).where(eq(activities.id, repair.id)))[0]).toMatchObject({ completedDate: '2026-11-11', paymentDate: '2026-11-11' })
      expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { workStatus: 'in_progress' })).status).toBe(200)
      vi.setSystemTime(new Date('2026-11-11T18:00:00.000Z'))
      expect((await request(`update/${repair.id}`, 'PATCH', manager.cookie, { workStatus: 'completed' })).status).toBe(200)
      expect((await getDb().select().from(activities).where(eq(activities.id, repair.id)))[0]).toMatchObject({ completedDate: '2026-11-12', paymentDate: '2026-11-11' })
      expect((await request(`update/${income.id}`, 'PATCH', manager.cookie, { paymentDate: '2026-10-31' })).status).toBe(200)
      expect((await getDb().select().from(activities).where(eq(activities.id, income.id)))[0].paymentDate).toBe('2026-10-31')
      for (const field of ['scheduledDate', 'completedDate', 'occurrenceDate']) {
        expect((await request('create', 'POST', manager.cookie, { name: `${prefix} forbidden date`, [field]: '2026-11-20' })).status).toBe(400)
        expect((await request(`update/${expense.id}`, 'PATCH', manager.cookie, { [field]: '2026-11-20' })).status).toBe(400)
      }
      expect((await getDb().select().from(activities).where(eq(activities.id, expense.id)))[0]).toMatchObject({ completedDate: '2026-11-10', paymentDate: '2026-11-10', occurrenceDate: null })
    } finally {
      vi.useRealTimers()
    }
  })

  it('filters the same financial activities and totals only settled money', async () => {
    const manager = await createSystemSession(['view-activities', 'create-activities', 'update-activities'], 'activity-totals')
    const common = { name: `${prefix} totals` }
    const income = await createActivity(manager.cookie, { ...common, financialKind: 'income', amount: 1000000, paymentDate: '2030-02-01' })
    const expense = await createActivity(manager.cookie, { ...common, financialKind: 'expense', amount: 250000, paymentDate: '2030-02-02' })
    for (const amount of [800000, null]) {
      const draft = await createActivity(manager.cookie, { ...common, financialKind: 'expense', amount: 800000 })
      expect((await request(`update/${draft.id}`, 'PATCH', manager.cookie, { paymentStatus: 'draft', paymentDate: null, amount })).status).toBe(200)
    }
    await createActivity(manager.cookie, { name: `${prefix} totals cleaning` })
    const query = `search=${encodeURIComponent(`${prefix} totals`)}&financialOnly=true`
    expect(summarySchema.parse(await (await request(`summary?${query}&limit=1&page=2`, 'GET', manager.cookie)).json()).data[0]).toEqual({ income: 1000000, expenses: 250000, net: 750000, draftCount: 2 })
    const listResponse = await request(`list?${query}&paymentStatus=settled&sort=amount&order=desc`, 'GET', manager.cookie)
    expect(listResponse.status).toBe(200)
    const list = z.object({ data: z.array(activityPublicSchema), total: z.number() }).parse(await listResponse.json())
    expect(list.total).toBe(2)
    expect(list.data.map((row) => row.id)).toEqual([income.id, expense.id])
    expect(summarySchema.parse(await (await request(`summary?${query}&paymentFrom=2030-02-02&paymentTo=2030-02-02&financialKind=expense&categoryId=activity-category-general`, 'GET', manager.cookie)).json()).data[0]).toEqual({ income: 0, expenses: 250000, net: -250000, draftCount: 0 })
    expect((await request(`list?${query}&paymentFrom=2030-03-01&paymentTo=2030-02-01`, 'GET', manager.cookie)).status).toBe(400)
  })

  it('requires module permissions on reads and writes', async () => {
    const denied = await createSystemSession([], 'activities-denied')
    for (const [path, method] of [['list', 'GET'], ['summary', 'GET'], ['rooms', 'GET'], ['categories', 'GET'], ['detail/missing', 'GET'], ['create', 'POST'], ['update/missing', 'PATCH']]) {
      expect((await request(path, method)).status).toBe(401)
      expect((await request(path, method, denied.cookie)).status).toBe(403)
    }
  })
})
