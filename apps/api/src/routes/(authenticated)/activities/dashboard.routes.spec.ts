import { afterAll, expect, it, vi } from 'vitest'
import { inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'
import { upcomingPlanSchema } from '../recurring-plans/schema'
import { activities } from './activities.table'
import { activityDashboardSchema, activityPublicSchema } from './schema'

const activityIds: string[] = []
const planIds: string[] = []
const prefix = `dashboard-${crypto.randomUUID()}`
function request(path: string, cookie?: string, body?: object, method = body ? 'POST' : 'GET') {
  return app.request(path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
}
async function create(cookie: string, body: object) {
  const response = await request('/activities/create', cookie, { name: prefix, ...body })
  expect(response.status).toBe(201)
  const row = z.object({ data: activityPublicSchema }).parse(await response.json()).data
  activityIds.push(row.id)
  return row
}
afterAll(async () => {
  if (activityIds.length) await getDb().delete(activities).where(inArray(activities.id, activityIds))
  if (planIds.length) await getDb().delete(recurringPlans).where(inArray(recurringPlans.id, planIds))
  await closeDb()
})
it('reports actual month cash, fills days, and keeps work and payment follow-up independent', async () => {
  const manager = await createSystemSession(['view-activities', 'create-activities', 'update-activities'], 'dashboard-cash')
  vi.useFakeTimers({ toFake: ['Date'] })
  try {
    vi.setSystemTime(new Date('2026-11-09T18:00:00.000Z'))
    const read = async () => z.object({ data: z.array(activityDashboardSchema), total: z.number() }).parse(await (await request('/activities/dashboard?limit=1&page=99', manager.cookie)).json()).data[0]!
    const before = await read()
    await create(manager.cookie, { financialKind: 'income', amount: 1000, paymentDate: '2026-11-01' })
    await create(manager.cookie, { financialKind: 'expense', amount: 200, paymentDate: '2026-11-10' })
    await create(manager.cookie, { financialKind: 'expense', amount: 900, paymentDate: '2026-10-31' })
    await create(manager.cookie, { financialKind: 'expense', amount: 800, paymentDate: '2026-11-11' })
    const draft = await create(manager.cookie, { financialKind: 'expense', amount: 700 })
    expect((await request(`/activities/update/${draft.id}`, manager.cookie, { paymentStatus: 'draft', paymentDate: null, workStatus: 'cancelled' }, 'PATCH')).status).toBe(200)
    const paid = await create(manager.cookie, { financialKind: 'income', amount: 300, paymentDate: '2026-11-02' })
    expect((await request(`/activities/update/${paid.id}`, manager.cookie, { workStatus: 'in_progress' }, 'PATCH')).status).toBe(200)
    await create(manager.cookie, {})
    const plan = (await getDb().insert(recurringPlans).values({ name: prefix, startDate: '2026-11-01', nextOccurrenceDate: '2026-11-01', active: false }).returning())[0]!
    planIds.push(plan.id)
    const scheduled = await getDb().insert(activities).values([
      { name: `${prefix}-clean`, recurringPlanId: plan.id, occurrenceDate: '2026-11-01' },
      { name: `${prefix}-paid-work`, recurringPlanId: plan.id, occurrenceDate: '2026-11-02', financialKind: 'expense', amount: 50, paymentStatus: 'settled', paymentDate: '2026-10-31' },
      { name: `${prefix}-unpaid-cancelled`, recurringPlanId: plan.id, occurrenceDate: '2026-11-03', workStatus: 'cancelled', financialKind: 'expense', amount: 60, paymentStatus: 'draft' },
    ]).returning()
    activityIds.push(...scheduled.map((row) => row.id))
    const after = await read()
    expect(after).toMatchObject({ today: '2026-11-10', monthStart: '2026-11-01', monthEnd: '2026-11-30', income: before.income + 1300, expenses: before.expenses + 200, net: before.net + 1100 })
    expect(after.daily).toHaveLength(10)
    expect(after.daily[0]!.income - before.daily[0]!.income).toBe(1000)
    expect(after.daily[9]!.expenses - before.daily[9]!.expenses).toBe(200)
    expect(after.daily[9]!.cumulativeNet - before.daily[9]!.cumulativeNet).toBe(1100)
    expect(after.expensesByRoom.reduce((sum, row) => sum + row.amount, 0)).toBe(after.expenses)
    expect(after.expensesByCategory.reduce((sum, row) => sum + row.amount, 0)).toBe(after.expenses)
    expect(after.attention.total).toBe(before.attention.total + 5)
    expect(after.attention.items.find((row) => row.name === `${prefix}-clean`)).toMatchObject({ overdue: true })
    expect(after.attention.items.find((row) => row.name === `${prefix}-paid-work`)).toMatchObject({ overdue: false })
    expect(after.attention.items.find((row) => row.name === `${prefix}-unpaid-cancelled`)).toMatchObject({ overdue: true })
    expect(after.attention.items.find((row) => row.id === paid.id)).toMatchObject({ workStatus: 'in_progress', paymentStatus: 'settled', overdue: false })
    expect(after.attention.items.find((row) => row.id === draft.id)).toMatchObject({ workStatus: 'cancelled', paymentStatus: 'draft', overdue: false })
  } finally {
    vi.useRealTimers()
  }
})
it('projects active future occurrences from the cursor with calendar month anchors', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  try {
    vi.setSystemTime(new Date('2026-11-27T18:00:00.000Z'))
    const manager = await createSystemSession(['view-recurring-plans'], 'dashboard-upcoming')
    for (const values of [
      { name: `${prefix}-daily`, startDate: '2000-01-01', intervalUnit: 'day', occurrenceIndex: 0, nextOccurrenceDate: '2000-01-01' },
      { name: `${prefix}-month`, startDate: '2026-08-31', intervalUnit: 'month', occurrenceIndex: 3, nextOccurrenceDate: '2026-11-30' },
      { name: `${prefix}-paused`, startDate: '2026-11-28', intervalUnit: 'day', active: false, nextOccurrenceDate: '2026-11-28' },
      { name: `${prefix}-generated`, startDate: '2026-11-28', intervalUnit: 'week', occurrenceIndex: 1, nextOccurrenceDate: '2026-12-05' },
    ]) {
      const row = (await getDb().insert(recurringPlans).values(values).returning())[0]!
      planIds.push(row.id)
    }
    const response = await request('/recurring-plans/upcoming', manager.cookie)
    expect(response.status).toBe(200)
    const result = z.object({ data: z.array(upcomingPlanSchema), total: z.number() }).parse(await response.json())
    expect(result.total).toBeGreaterThanOrEqual(8)
    expect(result.data).toHaveLength(8)
    expect(result.data.filter((row) => row.name === `${prefix}-daily`).map((row) => row.expectedDate)).toEqual(['2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04'])
    expect(result.data.find((row) => row.name === `${prefix}-month`)).toMatchObject({ expectedDate: '2026-11-30' })
    expect(result.data.some((row) => row.name === `${prefix}-paused` || row.name === `${prefix}-generated`)).toBe(false)
  } finally {
    vi.useRealTimers()
  }
})
it('requires each dashboard read permission', async () => {
  const outsider = await createSystemSession([], 'dashboard-denied')
  for (const path of ['/activities/dashboard', '/recurring-plans/upcoming']) {
    expect((await request(path)).status).toBe(401)
    expect((await request(path, outsider.cookie)).status).toBe(403)
  }
})
