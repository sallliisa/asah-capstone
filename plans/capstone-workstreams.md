# Capstone workstream index

Designs: Approved by the user.
Implementation: Tenant history and notification checkpoints are saved. Tenant model work is in progress.

The user approved this delivery order. Work proceeds through one main workstream
at a time. Missing external access can move an independent workstream forward.
The existing activity-category seed is complete under separate authorization.
No feature implementation was started while preparing these designs.

The [final review](capstone-final-review.md) separates approved decisions from
remaining proposals. The [working notes](capstone-working-notes.md) hold the
discussion record. The designs below own their feature rules. Existing behavior
retains approval; draft details are not automatically approved by this index.

| Order | Workstream | Owning designs | New work status |
|---|---|---|---|
| 1 | Tenant activity history | [Activities and recurring plans](activities/design.md). Existing [Rooms](rooms/design.md) owns occupant assignment. | Implemented with API/database checks. Authenticated browser acceptance remains. |
| 2 | Notifications and PWA | [Notifications](notifications/design.md). | Implemented locally. Real iPhone delivery and VPS scheduler checks remain. |
| 3 | Tenant attention model | [Tenant assessment](room-detector/design.md), with its [delivery plan](room-detector/implementation-plan.md). | Implemented as an experimental model with saved results and app views. Repair-burst ordering and C recall limits are published; VPS/browser checks remain. |
| 4 | Dashboard and DS analysis | [Dashboard](dashboard/design.md). | Financial filters, tenant projections, and executed analysis notebook are implemented. Authenticated browser checks remain. |
| 5 | Pi through Wisp | [Pi chat](pi-chat/design.md). | Wisp host and server session handoff implemented. Live login and native session acceptance passed. Shared account has no workspace; owner setup and browser/chat proof remain. |
| 6 | Intent classifier and RAG | [Intent classifier](intent-classifier/design.md) and [RAG](rag/design.md). | Not started. Separate designs within one workstream. |

## Dependencies

Tenant attribution must exist before live tenant scoring can use reliable
history. Model/data development can proceed offline before VPS deployment.
Saved predictions feed dashboard grades and Pi reads. Pi's live read tools
must work before claiming that classifier-selected context routes an answer.
RAG can be developed separately, then joined through the single context tool.

New attribution rules belong in Activities, not in the model or chat modules.
Recurrence remains the Activity owner's operation. Notifications observe its
saved occurrences. The dashboard projects existing records and predictions.
Each owner defines its rule once; other designs link to it.

## Completion and continuity

For each workstream, maintain the design, a short execution plan where useful,
and a verification/delivery record. Keep each document's job distinct:

- Design records behavior, ownership, fields, permissions, and failure paths.
- Execution notes record the current steps, dependencies, and next unfinished step.
- Verification records actual checks, persisted results, limits, and blockers.

Update this index after delivery. Record remaining work and setup dependencies
in the owning workstream so a later session can continue from a known state.
Use Git for changes rather than copy old proposals into new competing plans.

Complete and check the current workstream before moving on. Reuse credible
existing evidence. Runtime claims need runtime proof. Static document checks
alone do not establish deployment, push delivery, routing, or model quality.

Documentation stays current throughout. Final integration, owner trial, and
submission materials follow the connected features. WhatsApp and occupant
reports remain optional. Implementation waits for the user's start instruction.

## Checkpoint authorization

The user approved all documents, requested a checkpoint commit including the
Carta update, and instructed implementation to begin with workstream 1.

Tenant-history checkpoint includes schema, writes, forms, tenant history,
correction audit, tested rent ownership, and development migration. Browser
acceptance is pending. Workstream 2 proceeds independently.
