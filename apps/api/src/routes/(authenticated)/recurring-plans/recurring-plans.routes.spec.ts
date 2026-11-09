import { afterAll, describe, expect, it } from 'vitest'
import { asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { activities } from '../activities/activities.table'
import { generateDueActivities } from './generate'
import { recurringPlans } from './recurring-plans.table'
import { recurringPlanPublicSchema } from './schema'

const planIds: string[] = []

function request(path: string, method: string, cookie?: string, body?: object) {
  return app.request(`/recurring-plans/${path}`, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

async function createPlan(cookie: string, input: object) {
  const response = await request('create', 'POST', cookie, input)
  expect(response.status).toBe(201)
  const record = z.object({ data: recurringPlanPublicSchema }).parse(await response.json()).data
  planIds.push(record.id)
  return record
}

afterAll(async () => {
  if (planIds.length) {
    await getDb().delete(activities).where(inArray(activities.recurringPlanId, planIds))
    await getDb().delete(recurringPlans).where(inArray(recurringPlans.id, planIds))
  }
  await closeDb()
})

describe('Recurring activities', () => {
  it('creates fortnightly cleaning without expenses once per occurrence and retains history when disabled', async () => {
    const manager = await createSystemSession(['view-recurring-plans', 'create-recurring-plans', 'update-recurring-plans'], 'recurrence')
    const plan = await createPlan(manager.cookie, { name: 'Fortnightly cleaning', startDate: '2030-01-01', intervalCount: 2, intervalUnit: 'week' })
    await generateDueActivities('2030-01-30')
    await generateDueActivities('2030-01-30')
    const rows = await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id)).orderBy(asc(activities.occurrenceDate))
    expect(rows.map((row) => row.occurrenceDate)).toEqual(['2030-01-01', '2030-01-15', '2030-01-29'])
    expect(rows.every((row) => row.categoryId === 'activity-category-general' && row.workStatus === 'planned' && row.financialKind === 'none' && row.amount === null && row.paymentStatus === null)).toBe(true)
    expect((await getDb().select().from(recurringPlans).where(eq(recurringPlans.id, plan.id)))[0]).toMatchObject({ occurrenceIndex: 3, nextOccurrenceDate: '2030-02-12' })
    expect((await request(`update/${plan.id}`, 'PATCH', manager.cookie, { intervalCount: 1 })).status).toBe(400)
    expect((await request(`update/${plan.id}`, 'PATCH', manager.cookie, { active: false })).status).toBe(200)
    await generateDueActivities('2030-04-01')
    expect(await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id))).toHaveLength(3)
  })

  it('retains the original month day and generates draft costs without early or duplicate occurrences', async () => {
    const manager = await createSystemSession(['view-recurring-plans', 'create-recurring-plans'], 'monthly')
    const plan = await createPlan(manager.cookie, { name: 'Monthly service', startDate: '2032-01-31', intervalUnit: 'month', financialKind: 'expense', categoryId: 'activity-category-general', amount: 150000 })
    await Promise.all([generateDueActivities('2032-03-31'), generateDueActivities('2032-03-31')])
    const rows = await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id)).orderBy(asc(activities.occurrenceDate))
    expect(rows.map((row) => row.occurrenceDate)).toEqual(['2032-01-31', '2032-02-29', '2032-03-31'])
    expect(rows.every((row) => row.categoryId === 'activity-category-general' && row.workStatus === 'planned' && row.paymentStatus === 'draft' && row.amount === 150000 && row.paymentDate === null)).toBe(true)
    expect((await getDb().select().from(recurringPlans).where(eq(recurringPlans.id, plan.id)))[0].nextOccurrenceDate).toBe('2032-04-30')
  })

  it('bounds each plan backlog and catches up on the next run without missing days', async () => {
    const manager = await createSystemSession(['view-recurring-plans', 'create-recurring-plans'], 'backlog')
    const plan = await createPlan(manager.cookie, { name: 'Daily cleaning backlog', startDate: '2035-01-01', intervalUnit: 'day' })
    await generateDueActivities('2035-05-30')
    const first = await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id)).orderBy(asc(activities.occurrenceDate))
    expect(first).toHaveLength(100)
    expect(first[0].occurrenceDate).toBe('2035-01-01')
    expect(first[99].occurrenceDate).toBe('2035-04-10')
    expect((await getDb().select().from(recurringPlans).where(eq(recurringPlans.id, plan.id)))[0].nextOccurrenceDate).toBe('2035-04-11')
    await generateDueActivities('2035-05-30')
    const caughtUp = await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id)).orderBy(asc(activities.occurrenceDate))
    expect(caughtUp).toHaveLength(150)
    expect(caughtUp[100].occurrenceDate).toBe('2035-04-11')
    expect(caughtUp[149].occurrenceDate).toBe('2035-05-30')
    expect((await getDb().select().from(recurringPlans).where(eq(recurringPlans.id, plan.id)))[0].nextOccurrenceDate).toBe('2035-05-31')
  })

  it('requires plan permissions', async () => {
    const denied = await createSystemSession([], 'plans-denied')
    for (const [path, method] of [['list', 'GET'], ['rooms', 'GET'], ['categories', 'GET'], ['detail/missing', 'GET'], ['create', 'POST'], ['update/missing', 'PATCH']]) {
      expect((await request(path, method)).status).toBe(401)
      expect((await request(path, method, denied.cookie)).status).toBe(403)
    }
  })
})
