# Capstone workstream index

Designs: Approved by the user.
Implementation: Not started at the checkpoint.

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
| 1 | Tenant activity history | [Activities and recurring plans](activities/design.md). Existing [Rooms](rooms/design.md) owns occupant assignment. | Not started. Activity contract needs update. |
| 2 | Notifications and PWA | [Notifications](notifications/design.md). | Not started. Draft details. |
| 3 | Tenant attention model | [Tenant assessment](room-detector/design.md), with its [delivery plan](room-detector/implementation-plan.md). | Not started. Draft technical details. |
| 4 | Dashboard and DS analysis | [Dashboard](dashboard/design.md). | Not started for the approved additions. Existing panels and prior proof remain. |
| 5 | Pi through Wisp | [Pi chat](pi-chat/design.md). | Not started. Connection credentials supplied; login unverified. |
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
