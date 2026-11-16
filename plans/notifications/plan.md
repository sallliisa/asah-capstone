# Notification delivery plan

Design is approved. Implementation is in progress.

The existing recurrence operation owns due Activity creation. The notification
job creates one recipient/activity inbox entry and pending device deliveries,
then attempts push. The pending queue survives restart. No send-time or age
policy is added. A failed send leaves the inbox entry.

Subscriptions store the registering app session identity for explicit logout
cleanup. Natural session expiry does not suppress push. Actual phone delivery
remains best-effort and tapping protected data can require login.

Completed source work includes storage, owner guards, list/unread/read APIs,
subscription registration/removal, explicit sign-out cleanup, the internal job
endpoint, the VPS job runner, standard inbox, unread counts, device controls,
manifest, and service worker. Current work is final checks and delivery proof.

Production must provide WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY,
WEB_PUSH_SUBJECT, JOB_SECRET, and owner identity. The owner can be resolved
from CARTA_ADMIN_EMAIL or pinned with NOTIFICATION_OWNER_USER_ID. Generated
local keys stay in ignored apps/api/.env. Do not commit those values.

For the VPS scheduler, APP_API_URL is the API base, including /api for the
Vercel app target. Run pnpm --filter @southneuhof/api jobs:run each minute using
server-side environment configuration. Production scheduler installation waits
for VPS access. The local server also runs the existing minute worker.

Real iPhone subscription permission, delivery, and notification taps require
the owner's device. No mocked provider result establishes those outcomes.
