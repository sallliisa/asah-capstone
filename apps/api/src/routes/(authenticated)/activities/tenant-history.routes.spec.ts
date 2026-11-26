import { afterAll, expect, it } from 'vitest'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { roleAssignments, roles } from '../roles/roles.table'
import { rooms } from '../rooms/rooms.table'
import { users } from '../users/users.table'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'
import { generateDueActivities } from '../recurring-plans/generate'
import { activities, activityTenantAttributionChanges } from './activities.table'
import { businessDate } from './dates'
import { activityPublicSchema } from './schema'
import { recurringPlanPublicSchema } from '../recurring-plans/schema'

const activityIds: string[] = []
const planIds: string[] = []
const roomIds: string[] = []
const prefix = `tenant-history-${crypto.randomUUID().slice(0, 8)}`

function request(path: string, method: string, cookie: string, body?: object) {
  return app.request(path, { method, headers: { cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

async function tenant(name: string) {
  const session = await createSystemSession([], `${prefix}-${name}`)
  await getDb().insert(roles).values({ id: 'role-occupant', roleCode: 'occupant', name: 'Occupant', active: true }).onConflictDoNothing()
  await getDb().insert(roleAssignments).values({ userId: session.userId, roleId: 'role-occupant' })
  return session
}

afterAll(async () => {
  if (planIds.length) {
    const generated = await getDb().select({ id: activities.id }).from(activities).where(inArray(activities.recurringPlanId, planIds))
    activityIds.push(...generated.map((row) => row.id))
  }
  if (activityIds.length) {
    await getDb().delete(activityTenantAttributionChanges).where(inArray(activityTenantAttributionChanges.activityId, activityIds))
    await getDb().delete(activities).where(inArray(activities.id, activityIds))
  }
  if (planIds.length) await getDb().delete(recurringPlans).where(inArray(recurringPlans.id, planIds))
  if (roomIds.length) await getDb().delete(rooms).where(inArray(rooms.id, roomIds))
  await closeDb()
})

it('retains the historical tenant through room changes and audits explicit corrections atomically', async () => {
  const owner = await createSystemSession(['view-activities', 'create-activities', 'update-activities', 'view-users', 'update-rooms'], `${prefix}-owner`)
  const first = await tenant('first')
  const second = await tenant('second')
  const room = (await getDb().insert(rooms).values({ roomCode: prefix, name: 'History room', occupantId: first.userId }).returning())[0]
  roomIds.push(room.id)
  const created = await request('/activities/create', 'POST', owner.cookie, { name: 'Historical repair', roomId: room.id, tenantId: first.userId, financialKind: 'expense', amount: 250000 })
  expect(created.status).toBe(201)
  const record = z.object({ data: activityPublicSchema }).parse(await created.json()).data
  activityIds.push(record.id)
  const otherActivity = await request('/activities/create', 'POST', owner.cookie, {
    name: 'Other tenant repair',
    roomId: room.id,
    tenantId: second.userId,
    financialKind: 'expense',
    amount: 15000,
  })
  expect(otherActivity.status).toBe(201)
  activityIds.push(z.object({ data: activityPublicSchema }).parse(await otherActivity.json()).data.id)
  expect((await request(`/rooms/update/${room.id}`, 'PATCH', owner.cookie, { occupantId: second.userId })).status).toBe(200)
  await getDb().update(users).set({ statusCode: 'non_active' }).where(eq(users.id, first.userId))
  await getDb().delete(roleAssignments).where(and(eq(roleAssignments.userId, first.userId), eq(roleAssignments.roleId, 'role-occupant')))
  const historicalChoices = await request('/activities/tenants', 'GET', owner.cookie)
  const choices = z.object({ data: z.array(z.object({ id: z.string() })) }).parse(await historicalChoices.json())
  expect(choices.data.some((choice) => choice.id === first.userId)).toBe(true)
  const limited = await createSystemSession(['view-activities', 'update-activities'], `${prefix}-limited`)
  expect((await request('/activities/tenants', 'GET', limited.cookie)).status).toBe(403)
  const history = await request(`/activities/list?tenantId=${first.userId}`, 'GET', limited.cookie)
  expect(history.status).toBe(200)
  const rows = z.object({ data: z.array(activityPublicSchema) }).parse(await history.json()).data
  expect(rows.map((row) => row.id)).toEqual([record.id])
  expect(rows[0]).toMatchObject({ tenantId: first.userId, roomId: room.id, amount: 250000 })
  const totals = await request(`/activities/summary?financialOnly=true&tenantId=${first.userId}`, 'GET', limited.cookie)
  expect(totals.status).toBe(200)
  expect(await totals.json()).toMatchObject({ data: [{ income: 0, expenses: 250000, net: -250000, draftCount: 0 }] })
  expect((await request(`/activities/update/${record.id}`, 'PATCH', owner.cookie, { tenantId: second.userId })).status).toBe(200)
  expect((await getDb().select().from(activities).where(eq(activities.id, record.id)))[0]).toMatchObject({ tenantId: second.userId, amount: 250000 })
  const audit = await getDb().select().from(activityTenantAttributionChanges).where(eq(activityTenantAttributionChanges.activityId, record.id))
  expect(audit).toHaveLength(1)
  expect(audit[0]).toMatchObject({ previousTenantId: first.userId, newTenantId: second.userId, changedBy: owner.userId, reason: '' })
  expect((await request(`/activities/update/${record.id}`, 'PATCH', limited.cookie, { tenantId: second.userId, name: 'Updated repair' })).status).toBe(200)
  expect((await request(`/activities/update/${record.id}`, 'PATCH', limited.cookie, { tenantId: first.userId })).status).toBe(403)
  expect((await getDb().select().from(activities).where(eq(activities.id, record.id)))[0].tenantId).toBe(second.userId)
  await getDb().delete(roleAssignments).where(and(eq(roleAssignments.userId, second.userId), eq(roleAssignments.roleId, 'role-occupant')))
  expect((await request(`/rooms/update/${room.id}`, 'PATCH', owner.cookie, { name: 'Renamed history room', occupantId: second.userId })).status).toBe(200)
  expect((await getDb().select().from(rooms).where(eq(rooms.id, room.id)))[0]).toMatchObject({ name: 'Renamed history room', occupantId: second.userId })
})

it('keeps rent already due with the old tenant when the plan tenant and schedule change', async () => {
  const owner = await createSystemSession(['view-recurring-plans', 'create-recurring-plans', 'update-recurring-plans', 'view-users'], `${prefix}-rent`)
  const first = await tenant('rent-first')
  const second = await tenant('rent-second')
  const room = (await getDb().insert(rooms).values({ roomCode: `${prefix}-rent`, name: 'Rent room', occupantId: second.userId }).returning())[0]
  roomIds.push(room.id)
  const today = businessDate()
  const dateAt = (offset: number) => new Date(Date.parse(`${today}T00:00:00.000Z`) + offset * 86_400_000).toISOString().slice(0, 10)
  const response = await request('/recurring-plans/create', 'POST', owner.cookie, { name: 'Historical rent', roomId: room.id, tenantId: first.userId, financialKind: 'income', amount: 1500000, startDate: dateAt(-2), intervalUnit: 'day' })
  expect(response.status).toBe(201)
  const plan = z.object({ data: recurringPlanPublicSchema }).parse(await response.json()).data
  planIds.push(plan.id)
  await generateDueActivities(dateAt(-1))
  const generated = await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id))
  expect(generated).toHaveLength(2)
  expect(generated.every((row) => row.tenantId === first.userId && row.paymentStatus === 'draft')).toBe(true)
  expect((await request(`/recurring-plans/update/${plan.id}`, 'PATCH', owner.cookie, { tenantId: second.userId, startDate: dateAt(2), intervalCount: 2 })).status).toBe(200)
  await generateDueActivities(dateAt(2))
  await generateDueActivities(dateAt(2))
  const history = await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id)).orderBy(asc(activities.occurrenceDate))
  expect(history.map(({ occurrenceDate, tenantId }) => ({ occurrenceDate, tenantId }))).toEqual([
    { occurrenceDate: dateAt(-2), tenantId: first.userId },
    { occurrenceDate: dateAt(-1), tenantId: first.userId },
    { occurrenceDate: today, tenantId: first.userId },
    { occurrenceDate: dateAt(2), tenantId: second.userId },
  ])
})
