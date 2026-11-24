# Tenant model verification

17 November 2026. Implementation is in progress.

The Python environment is pinned in services/models/uv.lock. Four focused tests
passed for date windows, independent work/cash dates, tenant moves, planned
servicing exclusion, missing coverage, future payments, and no payment grace.
Their expected values were calculated separately from the feature function.
Ruff passed. The notebook executed with the saved experiment results.

The fixed 600-tenant generator produced 10,800 monthly snapshots, including
2,752 ineligible snapshots. Groups stay in their assigned 420/90/90 tenant
partitions. Fourteen model candidates were compared. Validation alone selected
200 trees, 128 samples, all engineered features. Final-test binary F1 was 0.9773,
C recall 0.8629, ordinary false positives 1.14%, and macro-F1 0.8463. The report
includes errors and confusion matrices. These are synthetic snapshot metrics.
They do not establish real-business accuracy or tenant fault.

A bounded request used the real loaded artifact through FastAPI TestClient.
Anonymous health access returned 401. Authorized health and scoring passed.
Serving features matched the saved training input. This is local HTTP adapter
proof, not VPS deployment or a performance measurement.

The API uses durable database state, immutable prediction rows, and source
revision checks. PostgreSQL triggers queue tenant changes in the same source
transaction. This covers Activity forms, recurrence writes, correction commands,
room occupant changes, and coverage edits without a framework modification.
Room references on saved predictions prevent deletion of their source context.
The development migration was applied after checking its ten existing migrations,
one Activity, and zero recurring plans. Existing rows were preserved.

Three API/database tests passed: two prior tenant-history regressions and one
new detector business journey. The new journey proves permission denial,
coverage audit, source queue updates, rejection of a result when the source
changes during inference, persistence for a matching revision, and retention
of that result during a service outage. Only the external model service is
mocked in the API test. Python proof owns model calculation and scoring.

Evidence is under .local/verification/tenant-model*. Live UI, VPS setup,
latency/memory, independent scenario review, and final integration remain.

## Independent scenario review

Ten separately authored histories were scored after parameter selection. Six
matched their review grade. Three recent repairs and three extra cleanings
received A instead of B. Six repairs in sixty days and eight extra cleanings
received B instead of C. The other cases covered on-time rent across a move,
a costly isolated repair, planned servicing, routine cleaning, repeated rent
delays, and recovery. Their inputs and actual results are saved in
services/models/scenario-review.json. No boundary was changed from these results.
The v1 model is a review candidate and is not ready for release. Dataset review
and a fresh held-out evaluation are required before a model revision.

The app now contains coverage confirmation, tenant profile results and history,
current-tenant room summaries, room-map grades, and a unique-tenant priority
list. API, SDK, and web type checks and focused lint passed. The real model
batch is bounded to 25 tenants and one service request. The last result remains
available while a refresh is pending. Authenticated browser proof remains open.

## Version 2 and retained limits

The next generator uses seed 2992027 and includes short incident bursts. A new
90-tenant final partition was generated before training. The original report,
card, and scenario outputs are retained in services/models/evaluations. The v1
source can be reproduced from checkpoint b2b4ae8.

The selected v2 candidate uses 200 trees and 512 samples. Binary F1 is 0.9212.
C recall is 0.8427, below the proposed 0.85 target. Ordinary false positives meet
the target. Eight of the ten known scenario cases now match their expected
grade. The two repair bursts remain under-ranked. These known regressions are
not new held-out proof. No manual grade override or hidden estimator change
was added. The model card explains the limit and a possible future supervised
comparison. This workstream has a functioning experimental model, with a
published quality gap. It is not a claim that every release target passed.

The updated notebook executed, Ruff passed, and four feature tests passed.
The app production build passed with existing large-chunk/plugin-time warnings.

## Occupancy and login state

A regression checks daily refresh for a still-assigned occupant whose account
is inactive. Login state must not replace the room's actual occupant reference.
The case failed before removing that extra filter and passes after the change.
Former profiles also keep their saved assessment visible when current role
assignments are removed. No past events are transferred to another tenant.
Profile refresh now invalidates the assessment resource after an authorized
write and polls saved results while mounted. These are read refreshes, not extra
notifications or repeated model jobs requested by the browser.

## Snapshot input audit

Historical snapshot inputs now clear future terminal work/payment states rather
than retain terminal values from the full generated history. A data audit found
zero future terminal states after regeneration. The selected candidate and test
metrics remain exactly equal to the prior v2 report, which is retained in
evaluations/tenant-v2.json. The feature calculation had already excluded future
events; this correction also makes the saved snapshot inputs match their date.
The current artifact version is tenant-if-v2-beda105c50e9. The local service was
reloaded with its reviewed checksum, and the notebooks were rerun.

## Saved room history

The room deletion regression removes its source activity first, so only the
saved assessment protects the room. Before the fix, the real DELETE returned
500. The route now maps the database foreign-key rejection to 409 with a clear
message. The regression also reads the room again to check that it remains.

## Boosted-tree adoption, 24 November 2026

The standard generator and trainer built `tenant-hgb-v3-17176ab74210` from
the reviewed snapshot hash. The saved artifact reproduced all 2,371 scores
of the approved candidate on the two synthetic holdouts. The authenticated
model endpoint returned the expected grade on all ten known cases and left
the ineligible input ungraded.

The app API type check and route compilation passed. An authenticated request
against isolated PostgreSQL 18 confirmed that the priority list orders by grade
first, then by model group, then by score. The model and operations notebooks
ran with the new artifact. See the [reviewed evaluation](../../services/models/evaluation.json).

Production activation remains open.

## Grade colors in light and dark mode, 25 November 2026

Chromium showed matching fills, text colors, and one-pixel outlines for the
room map, legend, popovers, user list, tenant profile, and assessment history.
The grade filter kept an outline on dimmed tiles. The six palettes had text
contrast of at least 8.26:1 against their fills. Build, Vue type checking, and
formatting passed. Focused lint reported the two existing native-toggle
warnings. Screenshots and check output are in
`.local/verification/tenant-grade-palette/`.

The restrained palette uses lighter outlines and muted sage, amber, and rose
fills. Text contrast against the fills is at least 7.08:1. The browser walkthrough
confirmed the palette in both themes across the same surfaces. Updated evidence
is in `.local/verification/tenant-grade-restrained/`.

The theme-based palette uses the app text color and the same one-pixel,
16% opacity outline as Loom cards. Chromium confirmed matching styles
across grade surfaces in both themes. Measured text contrast against the
fills ranged from 9.15:1 to 14.02:1. The web build and formatting check passed.
Evidence is in `.local/verification/tenant-grade-theme-tokens/`.

The Users list showed only A, B, or C on the chip. The full grade label
remained available to screen readers. Deep red C with light text measured
11.54:1 in light mode and 12.68:1 in dark mode. Chromium confirmed the
same palette and card outline across the map and grade chips. The web build
and focused lint passed. Evidence is in
`.local/verification/tenant-grade-compact-users/`.

The brighter grade C fill is visibly red in both themes. Chromium measured
text contrast of 8.64:1 in light mode and 7.20:1 in dark mode. The outline
still matched the card outline across grade surfaces. The build and CSS
format check passed. Evidence is in `.local/verification/tenant-grade-red/`.

The stronger green, yellow, and red fills matched across the map, legend,
popovers, Users list, profiles, and assessment history in both themes.
Chromium measured text contrast from 4.88:1 to 10.50:1. The grade outlines
matched the card outlines. Build and formatting passed. Evidence is in
`.local/verification/tenant-grade-strong-colors/`.

The lighter fills retained distinct green, yellow, and red hues. Chromium
verified at least 6.24:1 text contrast across both themes, with the same
card outlines and matching colors on every grade surface. Build and
formatting passed. Evidence is in `.local/verification/tenant-grade-lighter/`.

Chromium showed white C lettering with a dark red edge in both themes.
The red fill and card outline matched the previous palette. The white
lettering measured 9.95:1 against its edge. The room map removed the text
edge when a filter dimmed a C tile. Build and formatting passed. Evidence
is in `.local/verification/tenant-grade-white-text/`.

Removed the text outline from grade C. Chromium confirmed plain white
text on the existing red fill in both themes. Text-to-fill contrast was
2.76:1 in light mode and 2.59:1 in dark mode. Build and formatting passed.
Evidence is in `.local/verification/tenant-grade-plain-white/`.
