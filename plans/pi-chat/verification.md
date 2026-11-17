# Pi connection checkpoint

17 November 2026. Production chat integration passes. Final browser origin and
iPhone panel checks remain unverified. The sections below retain checkpoint
history; the final native acceptance section states the current result.

Installed Wisp Vue UI and core version 0.3.0 from the public npm registry.
The scoped GitHub registry returned 404; the public registry supplied the
package. The lock file records the resolved public packages. No Carta framework
package was changed.

Moved the three existing connection values from ignored apps/web/.env to ignored
apps/api/.env after checking that they matched. The browser receives a native
token and account ID through the owner-only no-store session route. It receives
no shared username or password. The backend discovers the account at runtime.
Its adapter follows the installed Wisp native password login and whoami protocol.
Cached tokens are verified on handoff; rejected sessions are replaced.

A live bounded check authenticated with the supplied instance. A second check
used the public Wisp core API with the resulting session. It reached authenticated
state, discovered zero workspaces, and cleared the session through setSession(null).
No token, password, account ID, or message was printed. No chat message was sent.
The owner has been asked to add a chat-ready workspace and generation model.
Native conversation reopening and generation are pending that setup.

The web has one stable asynchronous host in the authenticated shell. Wisp owns
workspace/model/conversation controls. App logout, account changes, and anonymous
startup clear the native browser session. A private per-tab endpoint key lets
the public SDK clear its own storage without a new storage implementation.
Native session revocation is not exposed by the current Wisp API; this check
establishes local clearing, not upstream token revocation.

The real app route test proves that an anonymous caller and another signed-in
user cannot obtain the shared native session. Only the external CloudflareOS
session adapter is mocked there. The separate live checks establish actual
native authentication and Wisp session acceptance.

Evidence is in .local/verification/pi-*. Authenticated browser rendering, iPhone
panel layout, conversation selection, live generation, and routed app reads are
not yet verified. Read tools and routing continue in the next workstream.

API, SDK, and web type checks passed. The owner route test passed. Focused API
and web lint and formatting passed. The production web build passed with the
existing large-chunk and plugin-time warnings. Browser origin handling still
needs a browser check; a Node connection does not establish CORS behavior.

## Helium UI check, 17 November

Browser access recovered. In the signed-in app at localhost:5181, the dashboard
rendered room links, tenant review priorities, financial totals, and charts.
The notification route rendered its empty inbox and iPhone Home Screen push
instructions with enable/disable controls. No push permission was requested.
Wisp opened and showed the shared account. The workspace selector offered only
Create workspace; native generation is still blocked by workspace/model setup.
A tenant profile rendered saved Not enough data assessments, required coverage
reasons, model versions, and history. Its coverage form opened with three date
inputs and the expense-completeness checkbox. No business data was changed.
These observations do not establish actual iPhone delivery or VPS deployment.

## Native workspace and generation

Created Kos De Mansion through Wisp. The instance supplied its existing Muse
Spark 1.3 Contributor model. A bounded connection prompt returned Koneksi
berhasil. After reload, the native SDK reopened the saved conversation and read
two messages without an error. This resolves the earlier empty-workspace
blocker. Model/tool resource grants and native classifier-driven answers with
sources remain unfinished until the remote MCP endpoint is deployed.

## Native tool authentication finding

The deployed app, owner sign-in, native session handoff, private MCP client,
VPS classifier, live RAG, and actual app projections pass. The production
deployment is dpl_74ZUbT6xBuadMo6wrWrd3CFH4K3N. The canonical app domain
points to that tested build. Its owner proof created and removed only its own
app login session.

The installed CloudflareOS gatekeeper-mcp source and connect form accept a
server URL and perform OAuth discovery; they provide no static per-connection
header field. Its portal connector accepts a deployment-wide fixed token, but
is for aggregators and would widen the connection beyond the intended account.
It is not the proposed solution. The app's static tool token therefore cannot
finish the native connection. The Pi design now proposes a bounded owner-only
OAuth flow through the compatible provider package. This authorization/API
revision is Draft; it has not been implemented.

## Approved direct MCP test scope

The user declined OAuth for this internal test and explicitly selected the
simpler direct connection. The MCP endpoint no longer checks a fixed token.
The configured active owner's per-operation read permissions remain in force,
and private area selection remains inside the classifier tool. App-only
/pi/context and /pi/session still reject non-owner app sessions.

The existing real database/MCP tests now connect without an Authorization
header. They still prove current read permissions, rejection of writes, strict
context selection, routing persistence, uncertainty handling, and corpus/area
filtering. The obsolete network-token assertion was removed because that access
rule changed. Both cases, API build, and lint pass. No OAuth dependency, OAuth
record, or consent page was added. Native connection proof is next.

## Final native acceptance

Deployment dpl_HxZYREtQ1sP6RKyi1cF9sV1ZEapy passed staged MCP proof and was
promoted to https://asah-capstone-nu.vercel.app. The same proof then passed on
the public canonical endpoint with no application Authorization header and no
Vercel protection bypass. API build/lint, two context tests, and SDK/web types
pass. No new application code was needed for native setup.

Connected the native MCP account and granted only getQuestionContext and
readAppData. Its description reports two read-only tools and zero approval
operations. A workspace gadget named Kos app tools holds the permanent
KOS_TOOLS binding so new chats inherit it. The private Skills collection contains
only kos-assistant/SKILL.md. No private workflow source was uploaded.

A real Indonesian rent question caused the native agent to load the skill,
call getQuestionContext, receive Finances plus the supporting rent passage,
and cite Prosedur operasional kos. Its routing audit exists in the app database.
The model first made a JavaScript variable error while loading the skill and
corrected it. This was an agent execution error, not an app route failure.

An initial cash question recovered from an incorrect argument wrapper, read the
correct current totals, but printed a record ID instead of a link. The base
skill now gives the exact request wrapper and Activity detail URL pattern. A
fresh chat loaded that revision, called both tools, and returned the matching
cash totals with a clickable Activity link. A fresh database read confirmed its
classifier audit. A separate Wisp client reopened that saved chat and restored
the linked answer. No business record or payment was changed.

Evidence: .local/verification/direct-mcp-production-proof.json,
native-chat-acceptance.json, cfos-guidance-chat.json, and cfos-chat-output.json.
The fresh cash chat has six user/assistant messages in the Wisp view. See
../../deploy/cfos-verification.md for installed connection details.

The post-deployment error scan reported a PostgreSQL connection-string SSL-mode
warning, with no application failure reported in that scan. Final browser
origin behavior remains unverified: Helium was in active user use and the
isolated in-app browser was unavailable. No further UI input was sent. Actual
iPhone panel and push checks remain separate; the user deferred push testing.
