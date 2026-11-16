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
