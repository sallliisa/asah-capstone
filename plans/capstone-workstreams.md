# Capstone workstream index

Designs: Approved by the user.
Implementation: Local checkpoints cover all six workstreams. External setup and final live acceptance remain in progress.

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
| 6 | Intent classifier and RAG | [Intent classifier](intent-classifier/design.md) and [RAG](rag/design.md). | Classifier, private context routing, read-only MCP, and RAG pipeline are implemented locally. Live Cloudflare indexing, native chat routing, and deployment remain. |

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

## Final local checkpoint

All six workstreams have local implementations. The final route run passed
21 tests across nine files. The added saved-room deletion case also passed:
the route returns 409 and retains the room. API production build and lint pass.
SDK and web type checks are repeated after the last API change. Existing web
production build, executed notebooks, and model checks remain valid.

Live acceptance still needs Cloudflare Workers AI/Vectorize credentials, a
CloudflareOS workspace with a generation model, VPS connection details, and
a working signed-in browser window. iPhone Home Screen push remains a device
check. Deployment files are ready; no production deployment is claimed.

The tenant model misses its C-recall target and two authored burst scenarios.
These limits are retained in the model card and report. The synthetic intent
classifier also requires clarification for many questions. Neither report
establishes accuracy on real tenant or owner data.

## Restart checkpoint, 17 November

The user paused work to restart the local computer. VPS deployment is committed
at 06ca6c3. The model service remains enabled at /home/muslik/app/models under
SSH alias kknkalongan_muslik. It binds to 127.0.0.1:5195 and requires the private
service token. Both models, anonymous rejection, batch scoring, and restart
recovery passed on the VPS. HTTPS publication and the job timer are unfinished.

Cloudflare credentials are saved only in ignored apps/api/.env. Live Workers AI
and Vectorize work. RAG candidates and failures are retained under analysis/rag
and .local/verification. No corpus is active. Current candidate version is
4e2e758fcfff33fa021fb23f90888d06e8989c1b21ff7a1e06c0932138ed073b.
Its hybrid vector/BM25 ranking and reranker use separately calibrated score
floors. Validation over 134 authored examples passed: precision 0.9643, recall
0.8901, zero unsupported. All current examples are validation only. Before any
activation, write a fresh held-out test set without changing the frozen
configuration, run knowledge:verify, inspect the result, then activate only if
the existing gates pass. Three new knowledge migrations were applied to the
development database. Latest migrations and final changes still need the final
API route checks, build, lint, SDK/web types, and guarded test migration.

Wisp has a new Kos De Mansion workspace and an available generation model.
The native response was Koneksi berhasil. A separate native SDK check restored
the saved conversation with two messages and no error. UI inbox, dashboard,
tenant assessment, history, and coverage form rendered without business writes.
The browser agent was interrupted before the computer restart. Its task was
to inspect the existing Cloudflare tunnel and prepare models.southneuhof.tech
to http://127.0.0.1:5195. It was instructed not to publish the new hostname
without action-time confirmation. Inspect its final state before continuing.

Next: finish held-out RAG proof and activation; finish HTTPS publication; wire
the deployed API to the VPS; install the minute job; configure the native MCP
resource and base skill; verify routing/citations and iPhone PWA push. Local
development servers and temporary processes may need a restart. Do not copy
secrets into Git or re-create a token merely because local processes stopped.

## Resumed integration

The VPS model service survived the local restart. Live retrieval passed its
fresh held-out gate and the verified corpus is active. The actual app MCP path
uses the VPS classifier through a private SSH forward for local proof; routing
evidence is saved. Native Wisp generation and saved conversation reads pass.

The Cloudflare tunnel is locally managed. Its root-only configuration cannot
be changed by muslik, which has no sudo access. A bounded configuration script
is prepared at /home/muslik/app/models/configure-tunnel.py. It preserves the
CloudflareOS route and validates the candidate before publication. The owner
was asked for an administrator SSH alias or to run that root step. No hostname
was published. Vercel deployment preparation excludes Python environments/data
and analysis files from the app upload. Existing production secrets cannot be
pulled, so production migrations must use the provider's existing environment
without replacing the database connection.

## HTTPS model checkpoint

The owner supplied administrator alias kknkalongan. The model hostname is now
published through the existing tunnel. Authenticated HTTPS health and intent
classification pass; anonymous health is 401, and CloudflareOS remains available.
The local API environment uses https://models.southneuhof.tech. Activation
guards and context-route tests pass. Deployment and the minute timer are next.
