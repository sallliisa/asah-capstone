# Pi through Wisp

Design: Draft
Implementation: Needs update

CloudflareOS, Wisp, one shared account, and read-only Pi remain approved.
The new MCP OAuth authorization section below needs approval. Existing behavior
and completed delivery keep their approval.

The user approved this document and authorized implementation at the checkpoint.
Earlier draft labels describe proposals now included in that approval.

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

### Native MCP authorization — proposed revision

The installed CloudflareOS custom MCP connector discovers OAuth authorization.
It does not offer a per-connection static Authorization header. The deployed
app tool endpoint currently accepts PI_TOOLS_SECRET, so the native connector
cannot complete its sign-in. Wisp session handoff already works; this is the
separate authorization from CloudflareOS to the app's private tools.

Replace the fixed tool token with OAuth 2.1 for this connection. Use
@better-auth/oauth-provider 1.6.23, which supports the installed Better Auth
1.6.23, and its supported JWT integration. Do not upgrade Carta or change
CloudflareOS source. The two app tools and their inputs remain unchanged.

1. Publish OAuth authorization-server and protected-resource metadata for the
   existing /api/pi-tools resource. Use the provider's supported helpers.
2. Allow the native connector to register a public client for the configured
   CloudflareOS MCP callback. Use authorization-code flow with S256 PKCE and
   refresh tokens. Do not enable password or client-credentials grants.
3. Use only pi:read and offline_access. Bind tokens to the app tool resource.
   Use the provider's default token lifetimes and record them during delivery.
4. Reuse app sign-in. Add an owner-only Pi access/consent page that shows the
   requesting connector and its read scope. The owner can Connect or Cancel,
   inspect the active grant, and revoke Pi access. No new account is required.
5. At every tool request, verify the token's issuer, audience, scope, grant,
   and subject. The subject must still be the configured active owner. Existing
   app read permissions still apply to each operation. Staff cannot approve or
   use an owner grant. Revocation blocks later app reads and token renewal.
6. Add the provider-owned OAuth client, access-token, refresh-token, consent,
   and JWT signing-key records through reviewed Drizzle migrations. Keep
   secrets server-side. Native tooling receives access tokens, not app login
   passwords or the provider's signing key.
7. Configure the native MCP connector's supported public callback base URL.
   Connect it to the deployed app endpoint and grant exactly getQuestionContext
   and readAppData to Kos De Mansion. Mark the real read tools as read-only in
   their MCP annotations. Install only the base skill upstream; private area
   documents remain behind the classifier-selected app tool.
8. Remove the fixed PI_TOOLS_SECRET authorization path and migrate its callers.
   Do not keep a second token bypass for the same endpoint. JOB_SECRET and
   MODEL_SERVICE_TOKEN remain separate and continue to protect their services.

Use existing Carta page, header, form, and button conventions for the small
consent/access surface. Keep the native Wisp chat UI. App logout still clears
that browser's native session. The owner can revoke the separate tool grant;
no app activity, payment, schedule, assignment, or tenant grade is writable
through either tool.

Before release, prove the owner flow and a denied non-owner flow against the
real database, plus PKCE/code reuse, wrong-resource or missing-scope tokens,
revocation, and the existing read permissions. Then connect the actual native
agent, ask Indonesian app and guidance questions, inspect classifier routing
and citations, and reopen its conversation. Existing app forms, model serving,
notifications, and the minute job can continue independently.

This revision replaces the failed static-header assumption. It does not change
the approved shared CloudflareOS account or add per-tenant accounts.

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
