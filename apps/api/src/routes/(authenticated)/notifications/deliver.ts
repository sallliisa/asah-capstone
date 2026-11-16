import { and, eq, isNotNull, lte, sql } from 'drizzle-orm'
import * as webpush from 'web-push'
import { getDb } from '../../../db'
import { activities } from '../activities/activities.table'
import { users } from '../users/users.table'
import { businessDate } from '../activities/dates'
import { notificationOwnerId } from './owner'
import { notifications, notificationDeliveries, pushSubscriptions } from './notifications.table'

export async function createDueNotifications(asOfDate = businessDate()) {
  const recipientId = await notificationOwnerId()
  if (!recipientId) return 0
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('carta-due-notifications'))`)
    const due = await tx.select({ id: activities.id, name: activities.name, date: activities.occurrenceDate }).from(activities)
      .where(and(isNotNull(activities.recurringPlanId), lte(activities.occurrenceDate, asOfDate), sql`not exists (select 1 from ${notifications} where ${notifications.activityId} = ${activities.id} and ${notifications.recipientId} = ${recipientId})`)).limit(100)
    let created = 0
    for (const activity of due) {
      const inserted = await tx.insert(notifications).values({ recipientId, activityId: activity.id, title: activity.name, body: `Activity due ${activity.date}` }).onConflictDoNothing().returning()
      if (!inserted.length) continue
      created += 1
      const subscriptions = await tx.select({ id: pushSubscriptions.id }).from(pushSubscriptions)
        .where(eq(pushSubscriptions.recipientId, recipientId))
      if (subscriptions.length) await tx.insert(notificationDeliveries).values(subscriptions.map((subscription) => ({ notificationId: inserted[0].id, subscriptionId: subscription.id }))).onConflictDoNothing()
    }
    return created
  })
}

export async function deliverPendingNotifications() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
  const subject = process.env.WEB_PUSH_SUBJECT
  if (!publicKey || !privateKey || !subject) return { sent: 0, configured: false }
  const recipientId = await notificationOwnerId()
  if (!recipientId) return { sent: 0, configured: true }
  let sent = 0
  for (let index = 0; index < 5; index += 1) {
    const processed = await getDb().transaction(async (tx) => {
      const row = (await tx.select({ delivery: notificationDeliveries, notification: notifications, subscription: pushSubscriptions }).from(notificationDeliveries)
        .innerJoin(notifications, eq(notifications.id, notificationDeliveries.notificationId))
        .innerJoin(pushSubscriptions, eq(pushSubscriptions.id, notificationDeliveries.subscriptionId))
        .innerJoin(users, eq(users.id, notifications.recipientId))
        .where(and(eq(notificationDeliveries.status, 'pending'), eq(notifications.recipientId, recipientId), eq(pushSubscriptions.recipientId, recipientId), eq(users.statusCode, 'active')))
        .limit(1).for('update', { of: notificationDeliveries, skipLocked: true }))[0]
      if (!row) return false
      try {
        await webpush.sendNotification({ endpoint: row.subscription.endpoint, keys: { auth: row.subscription.auth, p256dh: row.subscription.p256dh } }, JSON.stringify({ id: row.notification.id, title: row.notification.title, body: row.notification.body, url: `/activities/${row.notification.activityId}/detail` }), { vapidDetails: { publicKey, privateKey, subject }, timeout: 5000 })
        await tx.update(notificationDeliveries).set({ status: 'sent', attempts: row.delivery.attempts + 1, attemptedAt: new Date().toISOString(), error: null }).where(eq(notificationDeliveries.id, row.delivery.id))
        sent += 1
      } catch (error) {
        const status = typeof error === 'object' && error !== null && 'statusCode' in error ? Number(error.statusCode) : 0
        if (status === 404 || status === 410) await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.subscription.id))
        else await tx.update(notificationDeliveries).set({ status: 'failed', attempts: row.delivery.attempts + 1, attemptedAt: new Date().toISOString(), error: status ? `push_http_${status}` : 'push_unavailable' }).where(eq(notificationDeliveries.id, row.delivery.id))
      }
      return true
    })
    if (!processed) break
  }
  return { sent, configured: true }
}

export async function processNotifications() {
  const created = await createDueNotifications()
  const delivery = await deliverPendingNotifications()
  return { created, ...delivery }
}
