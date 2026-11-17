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
