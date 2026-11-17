# Deployment preparation

These files are prepared for review. They have not been installed on the VPS.
The app uses its existing hosting, database, and storage configuration. The VPS
runs one private Python model service and a minute job. It does not host an LLM,
embedding model, or vector database.

## Prepare the model runtime

Use Linux with systemd, Python 3.11, uv, and Node 24. Create a dedicated kos user
and place the checkout at /opt/kos. From services/models, run uv sync --frozen
--no-dev. Train offline with the pinned development environment or transfer our
reviewed artifacts and their checksum files into services/models/artifacts.
The repository contains reproducible generators and reports; binary artifacts
and generated raw histories are intentionally ignored.

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

## Pi and hosted RAG

The API server needs the CloudflareOS URL, username, and password. The browser
receives the native session only after owner authorization. Wisp selects native
workspaces and models. The current account authenticated but had no workspace
at the live check. The owner must provide a chat-ready workspace and model.

For RAG, configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and
VECTORIZE_INDEX_NAME in the API environment. The account is for Workers AI and
Vectorize; it is separate from Wisp's runtime account identity. The token needs
Workers AI inference and Vectorize read/write permissions for that account.
Run the knowledge maintenance commands described in apps/api/knowledge/README.md.

Configure a CloudflareOS remote MCP resource pointing to the deployed
/api/pi-tools endpoint. Give it Authorization: Bearer PI_TOOLS_SECRET. This is a
restricted tool credential, not an app administrator session. Attach the base
skill from apps/api/knowledge/agent-skills/kos-assistant/SKILL.md to the selected
workspace. Do not upload the private workflow documents to CloudflareOS. The
server exposes the router and authorized reads; it exposes no document resource
or app write operation. Verify the resource controls on the deployed instance.

## Acceptance still required

Check the real deployed API, service readiness, minute timer, restart recovery,
model latency/memory, owner permissions, native chat routing and sources, and
iPhone Home Screen push delivery/taps. Local types and mocks do not establish
these outcomes. Keep the experimental model limitations visible in the demo.
