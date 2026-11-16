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
