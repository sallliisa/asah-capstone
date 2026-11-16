import { afterAll, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
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
  expect((await request(`/rooms/update/${room.id}`, 'PATCH', owner.cookie, { occupantId: second.userId })).status).toBe(200)
  await getDb().update(users).set({ statusCode: 'non_active' }).where(eq(users.id, first.userId))
  const history = await request(`/activities/list?tenantId=${first.userId}`, 'GET', owner.cookie)
  expect(history.status).toBe(200)
  const rows = z.object({ data: z.array(activityPublicSchema) }).parse(await history.json()).data
  expect(rows.map((row) => row.id)).toEqual([record.id])
  expect(rows[0]).toMatchObject({ tenantId: first.userId, roomId: room.id, amount: 250000 })
  expect((await request(`/activities/update/${record.id}`, 'PATCH', owner.cookie, { tenantId: second.userId })).status).toBe(400)
  expect((await getDb().select().from(activities).where(eq(activities.id, record.id)))[0].tenantId).toBe(first.userId)
  expect(await getDb().select().from(activityTenantAttributionChanges).where(eq(activityTenantAttributionChanges.activityId, record.id))).toHaveLength(0)
  expect((await request(`/activities/attribute/${record.id}`, 'POST', owner.cookie, { tenantId: second.userId, reason: 'Corrected owner attribution' })).status).toBe(200)
  expect((await getDb().select().from(activities).where(eq(activities.id, record.id)))[0]).toMatchObject({ tenantId: second.userId, amount: 250000 })
  const audit = await getDb().select().from(activityTenantAttributionChanges).where(eq(activityTenantAttributionChanges.activityId, record.id))
  expect(audit).toHaveLength(1)
  expect(audit[0]).toMatchObject({ previousTenantId: first.userId, newTenantId: second.userId, changedBy: owner.userId, reason: 'Corrected owner attribution' })
  const limited = await createSystemSession(['view-activities', 'update-activities'], `${prefix}-limited`)
  expect((await request(`/activities/list?tenantId=${first.userId}`, 'GET', limited.cookie)).status).toBe(403)
  expect((await request(`/activities/attribute/${record.id}`, 'POST', limited.cookie, { tenantId: first.userId, reason: 'Not authorized' })).status).toBe(403)
  expect((await getDb().select().from(activities).where(eq(activities.id, record.id)))[0].tenantId).toBe(second.userId)
})

it('keeps delayed rent with the plan tenant and prevents reassignment after generation', async () => {
  const owner = await createSystemSession(['view-recurring-plans', 'create-recurring-plans', 'update-recurring-plans', 'view-users'], `${prefix}-rent`)
  const first = await tenant('rent-first')
  const second = await tenant('rent-second')
  const room = (await getDb().insert(rooms).values({ roomCode: `${prefix}-rent`, name: 'Rent room', occupantId: second.userId }).returning())[0]
  roomIds.push(room.id)
  const response = await request('/recurring-plans/create', 'POST', owner.cookie, { name: 'Historical rent', roomId: room.id, tenantId: first.userId, financialKind: 'income', amount: 1500000, startDate: '2040-01-01', intervalUnit: 'month' })
  expect(response.status).toBe(201)
  const plan = z.object({ data: recurringPlanPublicSchema }).parse(await response.json()).data
  planIds.push(plan.id)
  await generateDueActivities('2040-02-01')
  await generateDueActivities('2040-02-01')
  const generated = await getDb().select().from(activities).where(eq(activities.recurringPlanId, plan.id))
  expect(generated).toHaveLength(2)
  expect(generated.every((row) => row.tenantId === first.userId && row.paymentStatus === 'draft')).toBe(true)
  expect((await request(`/recurring-plans/update/${plan.id}`, 'PATCH', owner.cookie, { tenantId: second.userId })).status).toBe(400)
  expect((await getDb().select().from(recurringPlans).where(eq(recurringPlans.id, plan.id)))[0].tenantId).toBe(first.userId)
})
