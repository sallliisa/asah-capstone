# Notifications and iPhone PWA

Design: Approved
Implementation: In progress

Inbox, iPhone Web Push, and push on notification creation are approved.
Storage and integration details below remain draft recommendations. No app
implementation is included in this record.

The user approved this document and authorized implementation at the checkpoint.
Earlier draft labels describe proposals now included in that approval.

## 1. Purpose and scope

Notify the owner when a scheduled Activity opens. Save each notification
before attempting push so the inbox remains available when delivery fails.

Included:

- Authenticated /notifications inbox, unread count, All/Unread, and Mark all as read.
- One notification linked to each scheduled Activity when it opens.
- Per-device push subscriptions, service worker, and installable iPhone PWA.
- Background processing that does not require an open app.

Excluded:

- Tenant notifications, WhatsApp, advance reminders, and repeated overdue reminders.
- Quiet hours, delayed send times, notification-age suppression, and a digest.
- Offline record editing, payment changes through push, and automatic work completion.

## 2. Functional requirements

| # | Capability | Users and access | Expected result |
|---|---|---|---|
| 1 | Read inbox | Configured owner, signed in | See only their notifications, newest first. |
| 2 | Read/mark all | Same recipient | Update notification read state without changing the activity. |
| 3 | Enable this device | Same recipient, through a user action | Register a supported push subscription. Declining leaves the inbox usable. |
| 4 | Follow notification | Recipient with Activity read permission | Open the activity, with login first if the session expired. |
| 5 | Notify when a task opens | Configured owner | Save one notification when a recurring task opens or Schedule once creates a task. |

Recipient ownership applies to every read and write, even if an ID is known.
Tenant accounts do not receive owner reminders. Notification access does not
grant permission to read a linked Activity.

## 3. Data and business rules

The [Activity design](../activities/design.md) owns recurrence, occurrence
identity, work state, and payment state. Notifications do not duplicate them.

| Proposed record | Meaning and constraints |
|---|---|
| notifications | ID, recipient user reference, activity reference, title, body, createdAt, readAt. The recipient and Activity identify one notification. ReadAt is nullable and server-owned. |
| push_subscriptions | Recipient, endpoint, encryption keys, and audit dates. One endpoint has one current recipient. Subscription keys stay on the backend. |
| notification_deliveries | Notification/subscription pair, delivery state, attempt time, and bounded error code. One pair represents one logical device delivery. |

The Activity transaction saves the inbox entry and queues push for registered
devices. The background job sends queued deliveries. Repeated job runs,
rescheduling, and reading the inbox entry leave the notification count unchanged.

Keep a pending delivery record so process termination does not lose a saved
notification's send attempt. The worker can resume unprocessed delivery work.
Record confirmed sends. A network failure can leave delivery uncertain; do not
claim exactly-once display on a phone. Use a stable notification tag to reduce
duplicate display. Keep the saved inbox entry on every push failure.

Remove expired subscriptions. On logout/account change, remove the old user
association from this browser's subscription. On sign-in, subscribe only after
the correct recipient and permission are established. Never send an old user's
notifications to a device newly associated with another user.

Use application-server push keys in server environment configuration. The
public subscription key can be sent to the browser. The internal job uses its
own credential; it does not use a browser session. Reuse the proposed VPS job
runner and the existing repeat-safe recurrence operation.

Keep inbox history for the assignment. No automatic deletion is proposed.
The inbox is the notification record. A successful provider send is not proof
of display or reading.

## 4. User journeys and workflows

1. The owner installs the PWA on the iPhone Home Screen and signs in.
2. The owner taps Enable push notifications on this device. Request permission
   from that action. Show install/support/settings guidance when needed.
3. A recurring task opens or the owner selects Schedule once. The Activity
   transaction saves its notification and pending device deliveries.
4. The job attempts push delivery. The inbox and navigation unread count
   already include the notification.
5. The owner taps the push or inbox entry and opens the authorized Activity.
6. Reading the notification updates only read state. Work and payment follow-up
   remain explicit Activity operations.

Use the existing authenticated shell and standard collection controls for the
inbox. Keep All/Unread and Mark all as read together. Show title, activity/room
context, date, and read state. Keep device push controls available even with an
empty inbox. Preserve the navigation pill and iPhone safe-area clearance.

| Condition | Result | Next step |
|---|---|---|
| Permission denied or unsupported | Inbox still works. Explain the device state. | Owner can change settings or use the inbox. |
| Push send fails | Keep notification and record delivery failure. | Resume pending work or inspect the concrete provider error. |
| Job restarts | Resume durable pending work; recurrence remains repeat-safe. | Process newly created notifications normally. |
| Session expired on tap | Require login before protected data. | Return to the intended activity after login. |
| Activity access denied | Show access feedback without protected fields. | Return to the inbox. |
| Device offline | Push arrival remains best-effort. | Read the saved inbox when connected. |

## References and delivery boundary

[WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
documents Home Screen Web Push and user-triggered permission on supported
iPhones. Actual installation, permission, delivery, tap, and login-return
behavior must be checked on the owner's phone. No live proof is claimed here.

The [workstream index](../capstone-workstreams.md) owns delivery order and status.
