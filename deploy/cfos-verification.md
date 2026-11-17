# CloudflareOS production connection

17 November 2026. Native integration is verified. Browser origin and iPhone
layout acceptance remain open.

## Installed setup

- App: https://asah-capstone-nu.vercel.app
- CloudflareOS: https://cfos.southneuhof.tech
- Workspace: Kos De Mansion
- Native model: Muse Spark 1.3 Contributor
- MCP endpoint: https://asah-capstone-nu.vercel.app/api/pi-tools
- Resource grant: endpoint followed by #tool=getQuestionContext&tool=readAppData
- Workspace binding: KOS_TOOLS, held by the Kos app tools gadget
- Private Skills collection: Kos De Mansion assistant
- Skill path: kos-assistant/SKILL.md

The base skill source is apps/api/knowledge/agent-skills/kos-assistant/SKILL.md.
The native collection has no private workflow documents. The classifier tool
selects those documents on the app server. Workers AI embeds the question,
Vectorize selects evidence, and the hosted reranker checks support. These
services use server credentials independent of the native MCP connection.

The public MCP endpoint has no caller authentication for the approved internal
test. It exposes two read-only tools under the configured active owner's current
permissions. Model, job, app sign-in, and owner session handoff protections remain.

## Setup method

Used the installed CloudflareOS public API and its official cf-os API CLI on the
VPS. No CloudflareOS framework source was changed. Native authentication tokens
were passed through stdin and memory, never command arguments or source files.

The connector's normal connect flow probed the public MCP endpoint, completed
its single-use ticket and nonce handoff under the initiating account, and
created the connected MCP account. The named resource grant was attached to
the workspace. A permanent gadget binding makes KOS_TOOLS available in new
chat environments through CloudflareOS's normal binding inheritance.

The auto-provisioned context account owns a private collection. createContextSkill
installed the base skill; putContextDocument updated it after the observed call
and link issues. The context library exposes the base skill to the agent.
It cannot expose the app's private workflow sources because they were not
uploaded there.

To restore setup on a new workspace, connect the same endpoint through the native
MCP connector, choose only the two named tools, bind the resource as KOS_TOOLS,
and install the base skill in a private Skills collection. Existing chats keep
their original binding snapshot; start a new chat after connection changes.
Use the API command help from the installed version for exact argument shapes.
Do not add global instance instructions or change other users' connections.

## Observed proof

A native rent-policy chat loaded the base skill and called getQuestionContext.
The VPS model selected Finances. The tool supplied private workflow content and
a supporting passage from the active corpus. The final Indonesian answer cited
Prosedur operasional kos, Sewa dan pencatatan uang, and its version.

A fresh native cash chat called the classifier and readAppData. The answer
matched current settled cash, stated the date and all-room filter, and linked
the supporting Activity. Fresh app database reads confirmed both routing events.
A separate Wisp client reopened the saved native cash conversation and restored
the linked answer. No business record was changed.

Proof files are ignored under .local/verification: direct-mcp-production-proof.json,
native-chat-acceptance.json, cfos-guidance-chat.json, and cfos-chat-output.json.
The native model corrected an initial skill-loading JavaScript error. A first
cash run also corrected an argument error and omitted a link. The revised base
skill supplies the exact call shape and link format; a fresh chat passed.

The canonical app deployment is dpl_HxZYREtQ1sP6RKyi1cF9sV1ZEapy, source
9bdf875. The base skill was then updated in the native collection to match its
repository source. That content update does not require an app redeployment.

## Limits

These two real questions prove the connected path, not general model accuracy.
The authored model evaluation limits remain in the model cards. The final
production browser check was not completed because Helium was in active user
use and there was no isolated browser connection. SDK acceptance does not prove
browser origin handling. The user deferred installed-iPhone push testing.
