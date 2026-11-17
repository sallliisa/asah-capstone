# Notification checkpoint verification

17 November 2026. Implementation is in progress until live device checks finish.

The real notification routes and database passed two business tests. They prove
recipient isolation, repeat-safe due notification creation, separate read/work
state, durable delivery state, push after normal session expiry, and explicit
sign-out cleanup. The external push provider was mocked. The existing real
authentication test also passed. Three tests passed in this run.

API, SDK, and web type checks passed. The web production build passed, with
large-chunk and plugin-time warnings. Focused web lint and formatting passed.
Focused API lint passed with two warnings in the wider changed-file set;
notification, internal job, and runner lint passed without diagnostics.
The service worker syntax check passed. The local internal job returned HTTP
200 with recurrence and notification results. Local VAPID keys and job secret
are in the ignored API environment file.

Both notification migrations were applied to development and test databases.
No original Activity or recurring plan was removed. Natural app session expiry
does not remove device subscriptions. Explicit logout removes its subscription.

Evidence is in .local/verification/notifications. This proof does not establish
real iPhone permission, delivery, notification taps, authenticated inbox rendering,
or the production scheduler. These checks need the device and deployment access.
The inbox remains available when push fails. No reminder send time, age limit,
or repeated overdue push policy was added.

## Due batch correction

A six-notification regression found that the initial sender stopped after five
pending deliveries. The case failed before the correction with five sent
instead of six. The sender now drains pending work with five concurrent workers.
Each claimed delivery still uses row locking and a saved terminal state. The
two notification tests pass after the fix, including all six persisted sends,
no duplicate second pass, natural session expiry, and explicit logout cleanup.
The external push service remains mocked. No age window or send-time policy was
added. Real iPhone delivery still needs the device.


## Production scheduler

The canonical production API is deployed. kos-jobs.timer is enabled and active
under the muslik VPS account. Repeated actual runs completed recurrence,
notification, and tenant-assessment work with configured services. There was
no due work in those runs, so they do not establish real push delivery. The
user explicitly deferred the installed-iPhone delivery and tap check. No
temporary test reminder was created. Earlier local signed-in inspection showed
the inbox and iPhone Home Screen instructions; final device proof stays open.

## Production owner configuration correction

The installed-iPhone check reported Notifications are available to the configured
owner. A live login with the seeded owner reproduced HTTP 403 on the inbox.
Production had neither NOTIFICATION_OWNER_USER_ID nor CARTA_ADMIN_EMAIL, so
notificationOwnerId returned null for every signed-in user. Pi's separate
seed-email default had hidden this missing notification configuration.

Set CARTA_ADMIN_EMAIL in the production API environment to the existing owner
email. No user, role, permission, subscription, or business record was changed.
No application access rule or source code was changed. Staged deployment
dpl_BTbjWADLzhtdKD5sYUSHnN5mdxNR passed owner sign-in, inbox HTTP 200, and a
public push key match with the expected 65-byte decoded key. Promoted that
exact build. The first immediate canonical request still reached the previous
release; after alias propagation, the same live proof passed on the canonical
app. Each proof signed out only its own temporary login session.

Evidence: .local/verification/notification-owner-stage-proof.log and
notification-owner-production-proof.log. The deployment runbook now names this
required owner setting and inbox acceptance check. No new tests were needed
for this configuration-only correction. Device permission and actual push
delivery still require the iPhone check.

## Installed iPhone delivery check started

The user enabled push successfully in the Home Screen app. The real store has
one owner subscription with an Apple Web Push endpoint. Created one clearly
labeled temporary nonfinancial Activity under an inactive temporary recurring
plan, then called the production job endpoint. The normal notification pipeline
created its inbox entry and Apple accepted its delivery on attempt one. The
saved delivery state is sent with no error.

This establishes registration and provider acceptance. The user's visible
receipt and notification-tap check are pending. Keep the temporary Activity
until that check finishes, then remove only its Activity, inbox/delivery rows,
and inactive plan. Evidence and exact cleanup IDs are retained in ignored
.local/verification/iphone-push-fixture.json and iphone-push-delivery.json.
No subscription key, push endpoint token, or credential is recorded here.
