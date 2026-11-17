# Pi connection checkpoint

17 November 2026. Implementation is in progress.

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
