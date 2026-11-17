# Capstone workstream index

Designs: Approved by the user.
Implementation: All six workstreams are implemented. Production integration is
verified. Final device and browser checks remain as listed below.

The [final review](capstone-final-review.md) records the agreed scope. The
[working notes](capstone-working-notes.md) record the discussion. Each design
owns its feature rules. Git contains the earlier delivery checkpoints.

| Order | Workstream | Owning designs | Current delivery |
|---|---|---|---|
| 1 | Tenant activity history | [Activities](activities/design.md), [Rooms](rooms/design.md) | Implemented. Database checks prove historical attribution, moves, corrections, and former-tenant selection. Final authenticated form interaction remains unverified. |
| 2 | Notifications and PWA | [Notifications](notifications/design.md) | Implemented and deployed. VPS minute timer runs successfully. The iPhone registered successfully and Apple accepted one test push. The user confirmed receipt. Notification-tap confirmation is pending. |
| 3 | Tenant attention model | [Tenant assessment](room-detector/design.md), [delivery plan](room-detector/implementation-plan.md) | Implemented, deployed on the VPS, and connected to saved app results. The experimental model misses its C-recall target and two repair-burst cases. These limits remain published. |
| 4 | Dashboard and DS analysis | [Dashboard](dashboard/design.md) | Financial filters, tenant projections, and executed analysis are implemented. Local signed-in rendering was observed; final production filter and form interaction remains unverified. |
| 5 | Pi through Wisp | [Pi chat](pi-chat/design.md) | Production owner session handoff, native generation, read tools, and Wisp conversation reopening pass. Final browser origin and iPhone panel checks remain unverified. |
| 6 | Intent classifier and RAG | [Intent classifier](intent-classifier/design.md), [RAG](rag/design.md) | VPS classifier, Workers AI, active Vectorize corpus, private context selection, native tool calls, citations, live cash reads, and saved routing audits pass. |

## Current production checkpoint, 17 November 2026

The canonical app is https://asah-capstone-nu.vercel.app. Tested deployment
dpl_BTbjWADLzhtdKD5sYUSHnN5mdxNR is promoted. Its source commit is 4094d6f.
Existing database, storage, and login secrets were preserved. Production now
explicitly sets CARTA_ADMIN_EMAIL for the existing notification owner; the
authenticated inbox and push public-key checks pass.

The model service at https://models.southneuhof.tech requires its service token.
The VPS runs kos-models.service and kos-jobs.timer as muslik. Repeated minute
runs pass. The existing CloudflareOS tunnel route remains available.

CloudflareOS workspace Kos De Mansion has the native MCP connection and the
base kos-assistant skill. A Kos app tools binding holder exposes KOS_TOOLS in
new chats. The grant names only getQuestionContext and readAppData. The four
private workflow documents were not uploaded to CloudflareOS.

The user chose a public, unauthenticated /api/pi-tools endpoint for internal
testing. Anyone with the URL can invoke these two read tools using the configured
owner's current read permissions. No OAuth work is pending. App login, owner-only
Wisp handoff, model tokens, job tokens, and Cloudflare credentials retain their
protections.

Real native chats called the classifier and retrieved monthly rent guidance
with a source reference. A separate new chat read current cash and linked its
supporting Activity. Fresh database reads confirmed both routing audits. Wisp
reopened the linked answer in the same saved native conversation. See
[Pi verification](pi-chat/verification.md) and
[native setup proof](../deploy/cfos-verification.md).

## Remaining acceptance and limits

The installed iPhone Home Screen test has resumed. Permission and device
registration passed; Apple accepted one labeled test push on its first attempt.
The user confirmed visible receipt. Notification tapping awaits confirmation. The temporary
activity remains available for that tap and must be removed after the check.

Final production browser interaction and iPhone panel layout remain unverified.
The available Helium window was in active user use during the final check;
UI control stopped. There is no isolated connected browser. Earlier local
signed-in rendering and production SDK/API checks are recorded in the owning
verification files. They do not prove browser origin behavior.

The tenant model's C recall is 0.8427 against a 0.85 target, and two authored
repair-burst scenarios remain under-ranked. The intent model's synthetic macro
F1 is 0.8326, with 50.67% acceptance under its clarification policy. Keep these
limits visible. Authored and synthetic evaluations do not establish accuracy
on real tenants or real owner questions.

The active RAG corpus passed 166 authored validation and 32 fresh held-out test
questions. Held-out precision is 1.0, recall 0.7917, unsupported answers 0.
The small authored evaluation is not evidence of general accuracy.

## Delivery rules

Keep domain rules in their owning designs. Activities owns attribution and
recurrence. Notifications observes saved occurrences. Dashboard and Pi project
existing records and assessments. Keep verification records with actual proof,
failed checks, limits, and unfinished acceptance. Commit each completed checkpoint.
