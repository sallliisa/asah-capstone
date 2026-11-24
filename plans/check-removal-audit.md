# Application checks to remove or narrow

Surveyed 24 November 2026 at `cbf9510`, with the current Users Detail changes.
Scope covers the web app, API, tenant model, Pi, and integrations used by the app.

## Manual tenant coverage removed

The form and its write route are retired. The app uses the earliest dated activity
linked to the tenant and a room, up to one year back. The assessment still
requires 90 days and three due rent charges. The worker queues prior results
for recalculation and retains their history. The app derives the dates supplied
to the existing model input.
[Assessment](../apps/web/src/routes/%28authenticated%29/tenant-detector/TenantAssessment.vue) · [Worker](../apps/api/src/routes/%28authenticated%29/tenant-detector/process.ts)

The former write route lived in a Git-ignored directory. The current tunnel's
OpenAPI document omits it. Existing confirmation rows remain historical data.
[Ignore rule](../.gitignore#L19)

The signed-in preview showed assessment history without the form. An isolated
database and local model service saved a grade from 101 days and three due
rent charges without a confirmation row. The same check left eleven days and
one due charge ungraded and preserved the prior prediction.

## Implemented from the first pass

- Only due rent plans can block a tenant grade on recurrence completeness. Repair and cleaning facts remain available when the model cannot grade. [Worker](../apps/api/src/routes/%28authenticated%29/tenant-detector/process.ts) · [Model](../services/models/src/kos_models/features.py)
- Room, activity, and plan edits validate new associations. Edit Activity saves tenant corrections with an automatic audit entry and an optional note. [Room](../apps/api/src/routes/%28authenticated%29/rooms/update/%5Bid%5D/+server.ts) · [Activity](../apps/api/src/routes/%28authenticated%29/activities/update/%5Bid%5D/+server.ts)
- Edit Recurring Plan keeps generated and already-due activities on the old terms and applies a revised schedule to future occurrences. [Plan](../apps/api/src/routes/%28authenticated%29/recurring-plans/update/%5Bid%5D/+server.ts)
- Role switches check the permission for their current action. Edit User uses the loaded form and explains the session impact of deactivation inline. [Role switch](../apps/web/src/routes/%28authenticated%29/settings/users/%5BuserId%5D/detail/role-assignments/role-assignments.resource.ts) · [Edit User](../apps/web/src/routes/%28authenticated%29/settings/users/%5BuserId%5D/edit.route.vue)
- Denied navigation shows a message on the current page. A restricted direct link shows the Access denied page. [Router](../apps/web/src/router/guards.ts)
- Assessments refresh automatically. Changes to source records still queue former tenants. [Worker](../apps/api/src/routes/%28authenticated%29/tenant-detector/process.ts) · [Source change trigger](../apps/api/drizzle/20261116222107_tenant-detector-queue-safety/migration.sql)
- Notification routes use the identity already checked by the owner scope. [Scope](../apps/api/src/routes/%28authenticated%29/notifications/+scope.ts) · [Mark read](../apps/api/src/routes/%28authenticated%29/notifications/read/+server.ts)
- Pi asks for a specific missing detail when an uncertain question gives a topic cue. It retains the intent boundary and read permissions. [Clarification response](../apps/api/src/knowledge/context.ts)

## Second-pass candidates

### Small changes users can see

- **An extra View permission for Settings pages.** The Users, Roles, and Permissions menus and resources check `view-*`. Their endpoints check `list-*` or `detail-*`. A person with list access can lose the menu, and a person with only the View grant can open a page that fails to load. Bind each menu and route to the permission its endpoint uses. Keep list and detail grants distinct. Review existing grants before removing unused permission codes. [Settings navigation](../apps/web/src/manifest/navigation.ts#L44) · [Users resource](../apps/web/src/routes/%28authenticated%29/settings/users/users.resource.ts#L63) · [Users list](../apps/api/src/routes/%28authenticated%29/users/list/+server.ts#L50) · [Users detail](../apps/api/src/routes/%28authenticated%29/users/detail/%5Bid%5D/+server.ts#L4)
- **A directory permission to filter rows the user already sees.** Activity lists and financial totals require View Users when a tenant ID is present, even though the unfiltered activity list already contains the tenant ID and name. Pi applies similar extra gates to its activity and plan filters. Let filters narrow records already visible to the caller. Keep the grants for browsing the user directory or reading a tenant assessment. [Activity list](../apps/api/src/routes/%28authenticated%29/activities/list/+server.ts#L9) · [Activity response](../apps/api/src/routes/%28authenticated%29/activities/+scope.ts#L27) · [Financial totals](../apps/api/src/routes/%28authenticated%29/activities/summary/+server.ts#L8) · [Pi reads](../apps/api/src/routes/%28authenticated%29/pi/read.ts#L71)
- **A temporary identity error stays cached until reload.** Once the first identity request fails, later calls return the same failure, even after the server recovers. Let the recovery button retry the identity request and reuse the live session. Keep a real unauthorized response distinct from a network failure. [Identity state](../apps/web/src/framework/identity.ts#L24) · [Recovery screen](../apps/web/src/App.vue#L71)
- **One notification update blocks every other row.** While a read update runs, the inbox drops a second mark-read request. A user can open a second notification and leave it marked unread. Block repeats for the same row and coordinate the separate Mark All action. The API already updates unread rows only. [Inbox action](../apps/web/src/routes/%28authenticated%29/notifications/index.route.vue#L37) · [Read endpoint](../apps/api/src/routes/%28authenticated%29/notifications/read/+server.ts#L13)
- **The grade warns about a refresh before its scheduled run.** A missing prediction is flagged as stale. A saved result also becomes stale at midnight, before the 00:10 daily refresh can run. Use separate states for an initial assessment, queued work, a failed refresh, and a saved result superseded by new data. Apply the same rule on the profile and dashboard. [Profile result](../apps/api/src/routes/%28authenticated%29/tenant-detector/projection.ts#L31) · [Dashboard result](../apps/api/src/routes/%28authenticated%29/tenant-detector/list/+server.ts#L14) · [Daily schedule](../apps/api/src/routes/%28authenticated%29/tenant-detector/process.ts#L22)

### Small changes behind the scenes

- **Pi checks the same owner twice.** Its history and context routes each resolve the configured owner during authorization and again in the action. Reuse the authorized identity. The session route already does the check once. [History](../apps/api/src/routes/%28authenticated%29/pi/history/+server.ts#L8) · [Context](../apps/api/src/routes/%28authenticated%29/pi/context/+server.ts#L6) · [Session](../apps/api/src/routes/%28authenticated%29/pi/session/+server.ts#L5)
- **Pi starts a session request for every signed-in user.** It fetches the session before anyone opens Pi and uses a 403 to decide whether to hide the entry point. Use a server-reported availability flag and connect when the owner opens Pi. Keep the owner check on the session endpoint. [Page startup](../apps/web/src/routes/%28authenticated%29/pi/PiHost.vue#L12) · [Session authorization](../apps/api/src/routes/%28authenticated%29/pi/session/+server.ts#L5)
- **Role IDs and write payloads are checked more than once at the same boundary.** New-user role uniqueness is checked by the client schema, the server schema, and twice again in the server action. The Activity update and Recurring Plan create handlers also reparse the route's validated input. Use the route's parsed values, one rule for unique role IDs, and the final checks that protect the merged record and current role availability. [User input](../apps/api/src/routes/%28authenticated%29/users/schema.ts#L31) · [User creation](../apps/api/src/routes/%28authenticated%29/users/create/+server.ts#L12) · [Activity update](../apps/api/src/routes/%28authenticated%29/activities/update/%5Bid%5D/+server.ts#L19) · [Plan create](../apps/api/src/routes/%28authenticated%29/recurring-plans/create/+server.ts#L10)
- **A one-year model sends lifetime activity to a capped batch.** The API sends all room-linked activity for each tenant, and the model accepts at most 10,000 rows per tenant. A tenant can hit the limit through old rows that have no effect on the current score. Send only facts that can affect the scoring window. Keep the payload limit and isolate a rejected tenant so other results can still save. [Worker query](../apps/api/src/routes/%28authenticated%29/tenant-detector/process.ts#L34) · [Model input](../services/models/src/kos_models/features.py#L52) · [Batch contract](../services/models/src/kos_models/server.py#L62)
- **Independent background work stopped at the first failure.** A recurrence failure stopped pending push delivery and assessments on that run. A push failure could also prevent assessments. An invalid intent artifact stopped the shared model process from starting. The two entry points now share the job runner, and each model reports its own availability. [Production jobs](../apps/api/src/routes/internal/jobs/+server.ts#L5) · [Shared worker](../apps/api/src/background-jobs.ts#L14) · [Model startup](../services/models/src/kos_models/server.py#L19)
- **Obsolete guard helpers.** The API reference and soft-delete helpers in `cbf9510:apps/api/src/guards.ts` and `cbf9510:apps/api/src/soft-delete.ts` had no production callers. The old redirect alias and hash-reading helper also had no production callers. The active bookmark handling has its own call sites. [Active router hooks](../apps/web/src/router/index.ts#L3)

### Product policy to confirm

- **The app requires login credentials to record a tenant.** The only occupant path uses a user account, so a person who will never log in still needs an email, password, and role. A record-only tenant with optional login would remove that work. This changes the data model and needs a clear migration for existing occupants and history. [Create User](../apps/web/src/routes/%28authenticated%29/settings/users/users.resource.ts#L34) · [Account requirements](../apps/api/src/routes/%28authenticated%29/users/schema.ts#L31) · [Occupant lookup](../apps/api/src/routes/%28authenticated%29/rooms/occupants.ts#L6)
- **Unused account expiry states can disable login.** The published schema accepts Expired and Expiring Soon. The form only offers Active and Inactive, and the session hook rejects both expiry states. There is no expiry date in the user table. Check existing account data and clients before retiring the extra states and mapping each existing account to an explicit Active or Inactive state. [Accepted states](../apps/api/src/routes/%28authenticated%29/users/schema.ts#L9) · [Form states](../apps/web/src/configs/statuses.ts#L1) · [User table](../apps/api/src/routes/%28authenticated%29/users/users.table.ts#L11) · [Login check](../apps/api/src/routes/auth/auth.ts#L23)

Checks with a demonstrated purpose include required values for settled payments, unique recurring occurrences, deletion protection for records still in use, access to private data, and device notification ownership.

The first pass used source tracing and read-only OpenAPI checks. The second pass traced user-facing routes, app adapters, API guards and schemas, background jobs, model serving, and integration scripts. The findings are at source level unless the report states a live check. Shared framework internals, vendored assets, and test-only checks are outside this app audit.

## Implemented from the annotated review

- Tenant grades report pending work and failures separately. A saved grade is stale when the source revision changes. The scoring job selects activities that can affect the annual model window.
- The inbox tracks pending read actions per notification. Session recovery retries the identity request and preserves the intended route.
- Activity and User updates use the route's parsed values. Plan creation validates the final insert record. The user form shares the server's duplicate-role validation.
- Scheduled jobs report failures independently. The model service checks and serves each artifact independently.
- The unused API guard modules and browser redirect helpers were removed. The browser still handles existing bookmark formats.
- Pi history and context owner lookups and eager session handoff belong to app code. This item was answered as a question.

Browser verification recovered Notifications after a session HTTP 503 and accepted two overlapping read requests with controlled inbox responses. The isolated jobs route created a notification and ran the assessment job after a recurrence failure. Local model requests verified that a bad checksum disables only the affected model. API route checks passed the new assessment assertions. The existing room-delete assertion returned HTTP 500 on PostgreSQL 18, whose RESTRICT error code differs from the application's error mapping.
