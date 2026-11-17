# Pi through Wisp

Design: Approved
Implementation: In progress

CloudflareOS, Wisp, one shared account, and read-only Pi remain approved.
The user selected direct MCP access without OAuth for internal testing.
This current authorization scope replaces the earlier OAuth proposal.

## 1. Purpose and scope

Let the owner ask questions about app records and operating guidance from the
existing app. Use CloudflareOS for Pi and generation. Use Wisp's Vue UI rather
than build another chat interface.

Included:

- One stable chat host in the authenticated app.
- Shared-account session handoff and native conversation reopening.
- Authorized read tools for rooms/tenants, activities, schedules, finances,
  and saved tenant assessments.
- The routing/context tool defined by the intent-classifier design.

Excluded:

- Activity edits, payment settlement, assignment changes, and reminder changes by Pi.
- Tenant chat access, per-app-user CloudflareOS accounts, and a second chat backend.
- Automatic conversion of chat attachments into receipts or trusted knowledge.

## 2. Functional requirements

| # | Capability | Users and access | Expected result |
|---|---|---|---|
| 1 | Open chat | Authorized owner signed into the app | Wisp connects to the configured instance. |
| 2 | Select workspace/model/conversation | Same owner, with native workspace access | Wisp discovers available choices and handles selection. |
| 3 | Ask about records | Owner with the relevant app read permission | Pi answers from authorized tool results. |
| 4 | Reopen history | Authorized shared-account owner | Read native conversations without claiming per-user isolation. |
| 5 | Sign out | Current app session | Clear the browser's Wisp session and protected app access. |

## 3. Data and business rules

### Connection configuration

| Field | Meaning and rule |
|---|---|
| CLOUDFLARE_OS_URL | Browser-accessible instance base URL. Public endpoint configuration. |
| CLOUDFLARE_OS_USERNAME | Shared account username, server-side. |
| CLOUDFLARE_OS_PASSWORD | Shared account password, server-side. |

These are app configuration names. No manually supplied account, workspace,
or model ID is required. Wisp handles workspace/model discovery and selection.
For backend session handoff, supply the native token and returned account ID
at runtime. A normal app cookie is not a native CloudflareOS session.

The credentials currently supplied in apps/web/.env are unprefixed. During
implementation, place the backend credentials in apps/api/.env and deployment
server settings. Never bundle the shared password as frontend configuration.
Clear Wisp's native browser session on app logout and when the app starts
signed out. Handle token replacement and upstream revocation on the backend.

Configure the instance's allowed origins and a chat-capable workspace with a
generation model. Wisp selection does not provision those model resources.
The selected workspace must have our skill and tools before claiming that
domain routing works. Verify this against the supplied instance version.

### Read-only tool boundary

Use bounded app read operations for rooms, tenant-associated histories,
activities, plans, due facts, settled financial summaries, and saved model
results. The API applies its existing read permissions and validates filters.
Return calculated totals from the backend rather than ask Pi to infer them
from a paginated collection. Pi cannot submit client-supplied grades.

Expose no create/update/delete capability, arbitrary SQL, or general app-admin
credential to the agent. The backend enforces this boundary. A prompt alone
does not establish read-only access.

The [intent classifier](../intent-classifier/design.md) owns routing and private
workflow-document selection. The [RAG design](../rag/design.md) owns knowledge
retrieval and citations. Pi has no independent credentials or direct listing
access to their private source stores.

### Native MCP connection for internal testing

Connect CloudflareOS directly to the public /api/pi-tools endpoint without
OAuth or a fixed tool token. The user explicitly selected this simpler setup
for internal testing. Anyone with that URL can invoke the two read tools.
There is no network caller identity check on this endpoint.

Use the configured active app owner as the service principal. Each app read
still checks that owner's current permissions. Expose only getQuestionContext
and readAppData; no write, SQL, credential, or direct private-document-store
capability is exposed. Private workflow selection stays inside the classifier
tool. Mark the tools as read-only in their MCP metadata.

App sign-in, owner-only Wisp session handoff, MODEL_SERVICE_TOKEN, JOB_SECRET,
and Cloudflare server-side credentials keep their current protections. Remove
PI_TOOLS_SECRET from the endpoint and its configuration. Do not add a second
login or an OAuth provider for this test scope.

Connect the custom MCP server through CloudflareOS, grant the two tools to Kos
De Mansion, and install the base skill. Verify an Indonesian guidance answer
with source references, an app-data answer, classifier routing records, and
conversation reopening. iPhone push verification is deferred by the user.

### History and source authority

Use the shared owner's native CloudflareOS conversations. This is shared-account
history, not separate private history per app user. Keep it for the assignment
without automatic deletion. Add app-side conversation storage only if a verified
native limitation prevents the required reopening behavior.

Current room/payment/schedule facts come from app tools. Guidance comes from
approved editable content. Tenant-grade explanations preserve the distinction
between association and proven responsibility. Native chat attachments remain
in their existing chat workflow.

## 4. User journeys and workflows

1. The owner signs into the app. The authenticated backend obtains the shared
   account's native session and hands it to Wisp.
2. Wisp loads workspace, model, and conversation choices. The owner selects
   through its existing UI.
3. The owner asks a substantive domain question. Pi obtains the classifier-
   selected context and calls the permitted app reads or retrieval path.
4. Pi answers using actual records and available source passages. It reports
   missing information instead of inventing a result.
5. Closing the panel or changing app routes preserves its host. The owner can
   reopen native conversations. App logout clears the local native session.

Match the app theme through Wisp's supported configuration. Keep the chat host
outside individual route lifecycles. Check its floating panel and composer with
the navigation pill and iPhone safe areas. Do not change framework packages.

| Condition | Result | Next step |
|---|---|---|
| Login rejected or session expires | Show the native connection/session error. | Replace the session through the backend. |
| No chat-ready workspace/model | Explain the native setup issue. | Correct upstream configuration. |
| Tool permission denied | Return no protected data. | Use another authorized app feature. |
| A read tool fails | State that the requested data is unavailable. | Retry deliberately or use the app directly. |
| Send outcome uncertain | Inspect native conversation history before resending. | Avoid an automatic duplicate message. |
| Pi unavailable | Core forms, records, cash views, and reminders remain usable. | Restore the connection independently. |

## References and delivery boundary

[Wisp's integration guide](https://github.com/southneuhof/wisp/blob/main/docs/agent-integration.md)
and [auth types](https://github.com/southneuhof/wisp/blob/main/packages/core/src/types.ts)
define the host and authentication integration. Connection, origin handling,
session handoff, conversation reopening, and real read-only tool grants remain
unverified until the instance is tested.

The [workstream index](../capstone-workstreams.md) owns delivery order and status.
