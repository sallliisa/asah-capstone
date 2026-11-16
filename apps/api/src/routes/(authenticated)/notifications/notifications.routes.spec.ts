import { afterAll, afterEach, expect, it, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { sessions } from '../../auth/auth.entity'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { activities } from '../activities/activities.table'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'
import { notifications, notificationDeliveries, pushSubscriptions } from './notifications.table'
import { createDueNotifications, deliverPendingNotifications } from './deliver'
import * as webpush from 'web-push'

vi.mock('web-push', () => ({ sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }) }))
const ownerIds: string[] = []
const planIds: string[] = []
const savedOwner = process.env.NOTIFICATION_OWNER_USER_ID
const savedKeys = [process.env.WEB_PUSH_PUBLIC_KEY, process.env.WEB_PUSH_PRIVATE_KEY, process.env.WEB_PUSH_SUBJECT]

function request(path: string, cookie: string, body?: object) {
  return app.request(`/notifications/${path}`, { method: body ? 'POST' : 'GET', headers: { cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

async function setup() {
  const owner = await createSystemSession(['view-activities'], 'notification-owner')
  ownerIds.push(owner.userId)
  process.env.NOTIFICATION_OWNER_USER_ID = owner.userId
  const plan = (await getDb().insert(recurringPlans).values({ name: 'Notification plan', startDate: '2040-01-01', nextOccurrenceDate: '2040-01-01' }).returning())[0]
  planIds.push(plan.id)
  const due = (await getDb().insert(activities).values({ name: 'Old due work', recurringPlanId: plan.id, occurrenceDate: '2000-01-01' }).returning())[0]
  return { owner, plan, due }
}

afterEach(async () => {
  if (ownerIds.length) await getDb().delete(notifications).where(inArray(notifications.recipientId, ownerIds))
  if (ownerIds.length) await getDb().delete(pushSubscriptions).where(inArray(pushSubscriptions.recipientId, ownerIds))
  if (planIds.length) {
    await getDb().delete(activities).where(inArray(activities.recurringPlanId, planIds))
    await getDb().delete(recurringPlans).where(inArray(recurringPlans.id, planIds))
  }
  planIds.length = 0
})

afterAll(async () => {
  if (savedOwner === undefined) delete process.env.NOTIFICATION_OWNER_USER_ID
  else process.env.NOTIFICATION_OWNER_USER_ID = savedOwner
  for (const [index, key] of ['WEB_PUSH_PUBLIC_KEY', 'WEB_PUSH_PRIVATE_KEY', 'WEB_PUSH_SUBJECT'].entries()) {
    const value = savedKeys[index]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  await closeDb()
})

it('creates one inbox entry for old due work and isolates recipient read state from work state', async () => {
  const { owner, due } = await setup()
  await Promise.all([createDueNotifications('2040-01-01'), createDueNotifications('2040-01-01')])
  const saved = await getDb().select().from(notifications).where(eq(notifications.recipientId, owner.userId))
  expect(saved).toHaveLength(1)
  expect(saved[0].activityId).toBe(due.id)
  const stranger = await createSystemSession(['view-activities'], 'notification-stranger')
  expect((await request('list', stranger.cookie)).status).toBe(403)
  expect((await request('read', stranger.cookie, { id: saved[0].id })).status).toBe(403)
  expect((await getDb().select().from(notifications).where(eq(notifications.id, saved[0].id)))[0].readAt).toBeNull()
  expect((await request('read', owner.cookie, { id: saved[0].id })).status).toBe(200)
  expect((await getDb().select().from(notifications).where(eq(notifications.id, saved[0].id)))[0].readAt).not.toBeNull()
  expect((await getDb().select().from(activities).where(eq(activities.id, due.id)))[0]).toMatchObject({ workStatus: 'planned', paymentStatus: null })
  await createDueNotifications('2040-01-01')
  expect(await getDb().select().from(notifications).where(eq(notifications.recipientId, owner.userId))).toHaveLength(1)
})

it('queues new notifications immediately and sends each logical delivery once', async () => {
  const { owner, plan } = await setup()
  await getDb()
    .insert(activities)
    .values(Array.from({ length: 5 }, (_, index) => ({ name: 'More due work', recurringPlanId: plan.id, occurrenceDate: `2000-01-0${index + 2}` })))
  const response = await request('subscription', owner.cookie, { endpoint: 'https://push.example.invalid/device-one', keys: { p256dh: 'public-test-key', auth: 'auth-test-key' } })
  expect(response.status).toBe(200)
  await getDb()
    .update(sessions)
    .set({ expiresAt: new Date('2000-01-01') })
    .where(eq(sessions.userId, owner.userId))
  await createDueNotifications('2040-01-01')
  const subscription = (await getDb().select().from(pushSubscriptions).where(eq(pushSubscriptions.recipientId, owner.userId)))[0]
  expect(await getDb().select().from(notificationDeliveries).where(eq(notificationDeliveries.subscriptionId, subscription.id))).toHaveLength(6)
  process.env.WEB_PUSH_PUBLIC_KEY = 'public'
  process.env.WEB_PUSH_PRIVATE_KEY = 'private'
  process.env.WEB_PUSH_SUBJECT = 'mailto:test@example.invalid'
  vi.mocked(webpush.sendNotification).mockClear()
  expect(await deliverPendingNotifications()).toMatchObject({ sent: 6 })
  expect(await deliverPendingNotifications()).toMatchObject({ sent: 0 })
  expect(webpush.sendNotification).toHaveBeenCalledTimes(6)
  const deliveries = await getDb().select().from(notificationDeliveries).where(eq(notificationDeliveries.subscriptionId, subscription.id))
  expect(deliveries.every((delivery) => delivery.status === 'sent' && delivery.attempts === 1)).toBe(true)
  await getDb()
    .update(sessions)
    .set({ expiresAt: new Date('2099-01-01') })
    .where(eq(sessions.userId, owner.userId))
  expect((await app.request('/api/auth/sign-out', { method: 'POST', headers: { cookie: owner.cookie, 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(200)
  expect(await getDb().select().from(pushSubscriptions).where(eq(pushSubscriptions.recipientId, owner.userId))).toHaveLength(0)
  expect(await getDb().select().from(notifications).where(eq(notifications.recipientId, owner.userId))).toHaveLength(6)
})
