import { and, eq, isNotNull, lte, or, sql } from 'drizzle-orm'
import * as webpush from 'web-push'
import { getDb, type Tx } from '../../../db'
import { activities } from '../activities/activities.table'
import { users } from '../users/users.table'
import { businessDate } from '../activities/dates'
import { notificationOwnerId } from './owner'
import { notifications, notificationDeliveries, pushSubscriptions } from './notifications.table'

export async function queueActivityNotifications(tx: Tx, recipientId: string, tasks: readonly { id: string; name: string; dueDate: string }[]) {
  if (!tasks.length) return 0
  const inserted = await tx.insert(notifications)
    .values(tasks.map((task) => ({ recipientId, activityId: task.id, title: task.name, body: `New task due ${task.dueDate}` })))
    .onConflictDoNothing({ target: [notifications.recipientId, notifications.activityId] })
    .returning({ id: notifications.id })
  if (!inserted.length) return 0
  const subscriptions = await tx.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.recipientId, recipientId))
  if (subscriptions.length) {
    await tx.insert(notificationDeliveries)
      .values(inserted.flatMap((entry) => subscriptions.map((subscription) => ({ notificationId: entry.id, subscriptionId: subscription.id }))))
  }
  return inserted.length
}

export async function createDueNotifications(asOfDate = businessDate()) {
  const recipientId = await notificationOwnerId()
  if (!recipientId) return 0
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('carta-due-notifications'))`)
    const due = await tx
      .select({ id: activities.id, name: activities.name, dueDate: activities.dueDate, occurrenceDate: activities.occurrenceDate })
      .from(activities)
      .where(
        and(
          or(isNotNull(activities.dueDate), lte(activities.occurrenceDate, asOfDate)),
          sql`not exists (select 1 from ${notifications} where ${notifications.activityId} = ${activities.id} and ${notifications.recipientId} = ${recipientId})`
        )
      )
      .limit(100)
    return queueActivityNotifications(tx, recipientId, due.flatMap(({ id, name, dueDate, occurrenceDate }) => {
      const deadline = dueDate ?? occurrenceDate
      return deadline ? [{ id, name, dueDate: deadline }] : []
    }))
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
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (true) {
        const processed = await getDb().transaction(async (tx) => {
          const row = (
            await tx
              .select({ delivery: notificationDeliveries, notification: notifications, subscription: pushSubscriptions })
              .from(notificationDeliveries)
              .innerJoin(notifications, eq(notifications.id, notificationDeliveries.notificationId))
              .innerJoin(pushSubscriptions, eq(pushSubscriptions.id, notificationDeliveries.subscriptionId))
              .innerJoin(users, eq(users.id, notifications.recipientId))
              .where(and(eq(notificationDeliveries.status, 'pending'), eq(notifications.recipientId, recipientId), eq(pushSubscriptions.recipientId, recipientId), eq(users.statusCode, 'active')))
              .limit(1)
              .for('update', { of: notificationDeliveries, skipLocked: true })
          )[0]
          if (!row) return false
          try {
            await webpush.sendNotification(
              { endpoint: row.subscription.endpoint, keys: { auth: row.subscription.auth, p256dh: row.subscription.p256dh } },
              JSON.stringify({ id: row.notification.id, title: row.notification.title, body: row.notification.body, url: `/activities/${row.notification.activityId}/detail` }),
              { vapidDetails: { publicKey, privateKey, subject }, timeout: 5000 }
            )
            await tx
              .update(notificationDeliveries)
              .set({ status: 'sent', attempts: row.delivery.attempts + 1, attemptedAt: new Date().toISOString(), error: null })
              .where(eq(notificationDeliveries.id, row.delivery.id))
            sent += 1
          } catch (error) {
            const status = typeof error === 'object' && error !== null && 'statusCode' in error ? Number(error.statusCode) : 0
            if (status === 404 || status === 410) await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.subscription.id))
            else
              await tx
                .update(notificationDeliveries)
                .set({ status: 'failed', attempts: row.delivery.attempts + 1, attemptedAt: new Date().toISOString(), error: status ? `push_http_${status}` : 'push_unavailable' })
                .where(eq(notificationDeliveries.id, row.delivery.id))
          }
          return true
        })
        if (!processed) break
      }
    })
  )
  return { sent, configured: true }
}

export async function processNotifications() {
  const created = await createDueNotifications()
  const delivery = await deliverPendingNotifications()
  return { created, ...delivery }
}
