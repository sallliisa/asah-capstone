# Deployment preparation

The generic system service templates are available below. The model service is
now installed through the user service described in vps-verification.md.
The app uses its existing hosting, database, and storage configuration. The VPS
runs one private Python model service and a minute job. It does not host an LLM,
embedding model, or vector database.

## Prepare the model runtime

Use Linux with systemd, Python 3.11, uv, and Node 24. Create a dedicated kos user
and place the checkout at /opt/kos. From services/models, run uv sync --frozen
--no-dev. Train offline with the pinned development environment or transfer our
reviewed artifacts and their checksum files into services/models/artifacts.
The repository contains reproducible generators, reports, a compressed tenant
dataset, and the presentation tenant model. Other generated artifacts remain
ignored.

Copy models.env.example to /etc/kos/models.env and fill its private token and
artifact hashes. Keep that file readable only by root and the kos service user.
Use the same MODEL_SERVICE_TOKEN on the app API. Set MODEL_SERVICE_URL on the app
API to the service's HTTPS address. Keep the service bound to localhost behind
an authenticated HTTPS reverse proxy or tunnel. The HTTP bearer token is still
required at the service. The service has no app database or Cloudflare API key.

Install kos-models.service under /etc/systemd/system and enable it after checking
the paths and service user. Its limits allow one small CPU inference process.
Measure latency and memory on the actual VPS before accepting deployment. The
2 GB memory limit and 1.5 CPU limit are resource caps, not measured usage.

## Install the minute job

Copy jobs.env.example to /etc/kos/jobs.env. APP_API_URL is the deployed API base,
including /api for the current Vercel routing. JOB_SECRET must match the API's
private secret. The runner uses Node's native TypeScript support and built-in
fetch; it needs no package installation on the VPS.

Install kos-jobs.service and kos-jobs.timer, then enable the timer. The endpoint
catches up recurrence, creates inbox entries and attempts push, then processes
up to 25 tenant assessments. Daily assessment refresh is queued after 00:10
Asia/Jakarta once per date. That model job time does not set a notification time.
There is no notification age window or repeated overdue push policy.

## Notification owner

Set CARTA_ADMIN_EMAIL in the production API environment to the existing app
owner's email. Notifications has no default owner when this value is absent.
NOTIFICATION_OWNER_USER_ID can select a different explicit recipient and takes
precedence. Keep it unset when the shared app owner is the recipient. A working
admin login or Pi connection does not prove this notification setting exists.
Check authenticated /api/notifications/list after deployment before asking a
device to register for push. No seed or account recreation is needed.

## Pi and hosted RAG

The API server needs the CloudflareOS URL, username, and password. The browser
receives the native session only after owner authorization. Wisp selects native
workspaces and models. Kos De Mansion has a connected generation model and
read tools; see cfos-verification.md for current setup.

For RAG, configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and
VECTORIZE_INDEX_NAME in the API environment. The account is for Workers AI and
Vectorize; it is separate from Wisp's runtime account identity. The token needs
Workers AI inference and Vectorize read/write permissions for that account.
Run the knowledge maintenance commands described in apps/api/knowledge/README.md.

For the approved internal test, connect the CloudflareOS custom MCP resource
directly to the deployed /api/pi-tools endpoint without authentication. Anyone
with that public URL can invoke its two read-only tools. Attach the base
skill from apps/api/knowledge/agent-skills/kos-assistant/SKILL.md to the selected
workspace. Do not upload the private workflow documents to CloudflareOS. The
server exposes the router and authorized reads; it exposes no document resource
or app write operation. Verify the resource controls on the deployed instance.

## Acceptance status

Real deployed API, service readiness, minute timer, restart recovery, measured
VPS latency/memory, owner permissions, native chat routing, sources, and Wisp
conversation reopening pass. See cfos-verification.md and vps-verification.md.
Final production browser origin and iPhone panel checks remain unverified.
Installed-iPhone Home Screen push delivery and tapping passed with user
confirmation; temporary test records were removed. Keep the experimental
model limitations visible in the demo.

## Current VPS installation

The user selected SSH alias kknkalongan_muslik and app/models. The installed
root is /home/muslik/app/models. This account has no sudo access, but user
systemd and login linger are available. kos-models-user.service is installed as
~/.config/systemd/user/kos-models.service and enabled. The pinned Python 3.11
environment and reviewed artifacts are installed in that root. Its .env is mode
600 and contains only the service token, trusted artifact paths/hashes, and CPU
thread limits. No database or Cloudflare credentials were copied there.

Use systemctl --user status kos-models.service or journalctl --user -u
kos-models.service for operations. HTTPS publication and the app job timer also pass. See vps-verification.md
for measured checks.

## Stage the existing Vercel app

The linked project is asah-capstone. Existing production database, storage, and
authentication variables are preserved. New Cloudflare, private model/job,
and Web Push variables are configured for production. Secret values enter the
CLI through stdin and are not command arguments or output.

The API service build runs scripts/build-vercel.mjs. Normal builds only check
types and compile routes. A staged production deployment can explicitly set
CARTA_MIGRATE_ON_BUILD=true to apply pending migrations using Vercel's existing
production database secret. The script rejects this flag outside production.
No database reset or full demo seed runs during deployment.

Use vercel deploy --prod --skip-domain --build-env
CARTA_MIGRATE_ON_BUILD=true. Inspect its build and runtime results before
promoting that exact deployment. The upload excludes services/models, analysis,
and deploy, in addition to local files and secrets. The checked source set
contains no Python environment, raw histories, or .env files.

## Current live state

Deployment dpl_BTbjWADLzhtdKD5sYUSHnN5mdxNR passed staged checks and is promoted.
The canonical app is https://asah-capstone-nu.vercel.app. Its database migration
step used the existing Vercel secret; database, storage, and login secrets were
not replaced.

The user timer templates are installed as kos-jobs.service and kos-jobs.timer
in muslik's user systemd directory. The timer is enabled and running. Its
private environment targets the canonical /api base. Repeated actual runs
completed successfully. The user chose direct MCP access without OAuth for internal testing. The
private model and job endpoints keep their own tokens; the MCP endpoint uses
the configured owner read scope without checking a network caller identity.


Native setup and real answer proof are recorded in cfos-verification.md. The
base skill in the private native collection matches its repository source.
The two named tool grants are bound as KOS_TOOLS in Kos De Mansion.
