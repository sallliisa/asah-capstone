# Tenant attention grade

Design: Approved
Implementation: In progress

Prepared for later review, 17 November 2026. The user asked us to handle the
remaining details and write the recommendations before implementation.
Previously approved decisions remain approved. New choices below are proposals.

The user approved this document and authorized implementation at the checkpoint.
Earlier draft labels describe proposals now included in that approval.

## 1. Purpose and scope

Help the owner choose which tenants need a review, using associated repairs,
extra cleaning, and rent payments across their rooms. Keep one Activity record
with a room reference and an optional historical tenant reference. Use one
trained tenant classifier and save its results in the app.

Included: synthetic data, feature calculations, recorded activity history, model
comparison, grade calibration, saved predictions, serving, refresh jobs, and
tenant profiles, room context, and the dashboard priority list.

Excluded: tax calculations, tenant billing, partial payments, late fees, proven
fault or character assessments, asset diagnosis, cleanliness inspections, repair duration, automatic
retraining, and automated maintenance actions. Tax reminders use owner-set dates.

### Already settled

| Topic | Decision |
|---|---|
| Grades | A · Routine; B · Check soon; C · Check first. Owner-review priority, with Not enough data separate. |
| Model | One supervised histogram gradient-boosted tree classifier trained on synthetic A/B/C labels. |
| Assessment owner | Tenant. Associated events and the grade follow the tenant across room changes. A move does not reset the grade. |
| Activity history | One activity appears in room and tenant histories. The tenant association persists after move-out, with explicit corrections allowed. No duplicate financial record. |
| Stay records | Not required for this version. The grade is not keyed to a tenant-room period. |
| History | Up to 12 calendar months; at least 90 days of recorded history and three due rent occurrences for repeated-payment patterns. |
| Refresh | Daily and after relevant activity/payment changes. |
| Rent | Monthly payments with no grace period. |
| Cleaning | Roughly twice a month, with flexible dates. Extra cleaning is anything outside that routine. |
| AC servicing | Every four months per room; separate from corrective repairs. |
| Normal synthetic frequencies | 0–2 corrective repairs per year, usually 0–1 in 90 days; 0–1 extra cleanings in 90 days. |
| Frequency examples | B: three repairs or three extra cleanings in 90 days. C: six repairs in 60 days, or six to eight extra cleanings in 90 days. These guide example labels. |
| Hosting and data | Synthetic histories are allowed. Prefer external services; use the 2 vCPU / 8 GB VPS for components we cannot offload. |

The [working notes](../capstone-working-notes.md) and
[example histories](../room-detector-scenarios.md) record the agreed direction.
A/B/C meanings do not need another decision. Numerical score boundaries still
need validation under those meanings.

### Remaining choices: my recommendations

| Choice | Proposal | Reason |
|---|---|---|
| Dataset | 600 fictional tenants over 18 months, with room changes and monthly snapshots. | Independent tenant histories without a large training job. |
| Repair cost | Most ordinary repairs Rp50,000–500,000; include isolated Rp500,000–2,000,000 repairs. | Allow costly individual incidents without an automatic C. |
| Feature owner | One Python calculation shared by training and serving. | Keep the meanings and date rules identical. |
| Missing data | Not enough data when required inputs are unavailable. | Unknown history is different from zero incidents. |
| Observation start | Earliest dated activity linked to the tenant and a room, limited to the current window. | Use existing records for the assessment. |
| Evaluation | Fixed 70/15/15 split by tenant and generation group. | Related tenant snapshots and shared synthetic room histories must not cross splits. |
| Overdue override | No automatic overdue-to-C rule in the first version. | Current overdue facts remain visible independently. |
| Service | One private Python service with one worker on the VPS. | Keep resource use small; train offline. |
| Persistence | App-owned refresh state and prediction history. | Saved results remain available during a service outage. |
| Job timing | Check pending rooms every minute; queue the daily refresh at 00:10 Jakarta time. | Work continues without an open browser and survives restarts. |
| Occupant change | Keep previous associations and recompute the affected tenant results. | A new occupant never inherits the previous tenant's events. |

## 2. Functional requirements

| # | Capability | Access | Result |
|---|---|---|---|
| 1 | Read results and history | View Users and View Activities; room views also require View Rooms | Saved tenant grade, effective window, reasons, and freshness. |
| 2 | Review priorities | Same read access | C before B before A. Within a grade, show the most recently refreshed model group first, then sort by score within that group. |
| 3 | Process refresh | Internal authenticated job | Save a versioned result or a clear failure state. |

Reasons can disclose financial information. Occupant room access alone must
not grant these reads. Pi uses the same app permissions; a shared CloudflareOS
account grants no extra app access.

## 3. Data and business rules

### 3.1 Existing owners and source rules

Use the existing [Activities](../../apps/api/src/routes/%28authenticated%29/activities/activities.table.ts),
[Recurring Plans](../../apps/api/src/routes/%28authenticated%29/recurring-plans/recurring-plans.table.ts),
[Rooms](../../apps/api/src/routes/%28authenticated%29/rooms/rooms.table.ts), and
[Activity Categories](../../apps/api/src/routes/%28authenticated%29/activity-categories/activity-categories.table.ts)
contracts as the starting point. The new historical tenant reference is a
proposed Activity contract change. No new work-start dates, asset IDs, or
inspection scores are assumed.

Historical attribution, rent-plan binding, and correction audit are owned by
[Activities](../activities/design.md#tenant-attribution). The model consumes
those associations and does not infer them from current room assignments.

Map the stable seeded IDs for Corrective Repairs, Routine Cleaning, Extra
Cleaning, Scheduled Servicing, and Room Rent. Use current category names for
display. Renames do not change model meaning. Other categories are excluded.
A missing category is a configuration error, not a reason to guess from names.

Use explicitly tenant-associated, room-linked activities; do not allocate shared expenses. IDs are links,
not model inputs. Exclude descriptions, receipts, occupant identities, and room
codes from numerical features. Use completedDate for completed-work counts and
paymentDate for settled expenses. Draft expenses are not recorded money spent.
Work completion and payment remain independent. Count each activity once.

Rent inputs use Room Rent income activities with an occurrenceDate. Ad-hoc
payments have no expected date and cannot provide lateness. A cancelled work
state does not cancel a Draft payment. Use actual activity amounts for past
rent; current room-type cost must not replace historical amounts.

Catch up the existing recurrence generator before scoring. A due, active Room
Rent income plan for the tenant makes the rent data incomplete until generation
catches up. The service returns recorded repair and cleaning facts even when it
cannot issue a grade.

### 3.2 Dates and recorded history

Use Asia/Jakarta dates. A snapshot has an asOfDate; include records known by
that date. Same-day refresh includes the records currently saved and runs again
after later changes. Rent is on time on its expected date and late from the
following date, with no grace period. This adds no fees or penalties.

Only completions and payments dated on or before asOfDate count as completed
or paid in that snapshot. Future-dated money is not already received or spent.
This snapshot rule does not edit the saved Activity state.

The assessment uses the earliest recorded due date, completion date, or payment
date on an activity linked to the tenant and a room. It counts dates on or before
the assessment date. Limit the start to the day after the assessment date minus
12 calendar months. Use the assessment date when there are no dated records.
Clip the short 90-day window to the same start. Use 30 observed dates for one
observed month in rate calculations.

Require 90 observed dates, three due rent charges, known amounts, and complete
recurrence generation for the assessment. The grade reflects recorded activity.
An event with an unknown required amount produces a missing-data reason.
Expense-free repairs contribute work and zero recorded spend.

Aggregate associated activities across room changes within the same automatic
history window. Keep the original room on every event for context. No sufficient
rent history means Not enough data, rather than a fabricated rent value.
Move-out preserves the last assessment with its date. Closed or inactive tenant
profiles remain readable to the authorized owner. New recorded payments or
corrections can refresh their result; routine daily refresh targets current
occupants. Returning tenants retain their history and use the current window.

The grade describes recorded owner-attention workload, not tenant character or
fault. Rates use the observed date span. Multiple-room tenants can have more associated work. Include those cases
in evaluation and show room context rather than claim an exposure-adjusted
behavior comparison. A later requirement for occupied-room-day rates would
need reliable occupancy history.

Historical synthetic snapshots must truncate future events and payment/work
states. Current mutable app rows cannot recover every past edit. Save compact
input snapshots with live predictions so past results remain reviewable.

### 3.3 Feature contract

Use one ordered, versioned feature set for training and serving:

Every feature below is aggregated by historical tenantId across associated
rooms, not by today's room occupant. Tenant identity itself is not an input.

| Feature | Calculation |
|---|---|
| repairCount90 | Completed corrective repairs in the clipped 90-day window. |
| repairRate30 | Completed corrective repairs in the usable window × 30 / observed days. |
| repairSpend30Log | log(1 + settled corrective-repair expenses × 30 / observed days), using payment dates in the usable window, in rupiah. |
| extraCleaningCount90 | Completed extra-cleaning activities in the clipped 90-day window. |
| extraCleaningRate30 | Completed extra-cleaning activities in the usable window × 30 / observed days. |
| rentLateShare | Settled-late or currently overdue rent occurrences / all rent occurrences due through asOfDate in the usable window. Count an occurrence once. |
| meanSettledLateDays | Mean positive delay for settled-late rent due in the usable window; zero if none. |
| oldestUnpaidDays | Largest positive asOfDate minus occurrenceDate among unpaid rent due in the usable window; zero if none. |
| overdueAmountShare | Known overdue rent amount / total expected rent amount due in the usable window. |

Early payments have zero delay. Due-today unpaid rent is due, not overdue, and
is included in the denominator. Rent due before the model window remains in
current factual overdue alerts without silently extending the model window.

Routine-cleaning and planned-servicing counts supply context and quality checks,
not adverse inputs. Flexible cleaning dates create no overdue days. A current
tenant identity, a room label, or rent price alone never raises priority. Recorded
expenses are counted by money date, independently of work completion.

### 3.4 Synthetic histories and labels

Create 600 fictional tenant histories over 18 months. Save monthly eligible
snapshots plus short-history cases for eligibility checks. Vary tracking starts
and monthly rent anchors. Use mainly Rp1.5–1.6 million monthly rent, with other
examples within Rp1.4–2.5 million. Routine cleaning averages twice a month,
with varying dates and some months with one or three events.

Use the approved ordinary incident ranges per occupied room for synthetic
generation. Include moves, returning tenants, previous unpaid rent, and some
tenants with multiple rooms. Preserve each event's tenant association. Normal
histories follow those ranges with variation. Do not create
a repair recurrence or require extra cleaning every quarter. Most ordinary
corrective expenses are Rp50,000–500,000, rounded to Rp10,000. Include isolated
Rp500,000–2,000,000 repairs. Repeated-repair cases mix small and costly events;
frequency must not always imply a high individual cost. Planned servicing has
its own category, including high-spend cases. Cleaning costs are not features.

Include ordinary, repair-heavy, cleaning-heavy, late-paying, unpaid, mixed,
recovered, high-planned-spend, and incomplete-history families. Start with about
80% ordinary tenant histories for fitting; report actual snapshot counts, which
can differ as conditions change. Include one-day late payments and payments
settled after a long delay. No grace period is inserted.

Use agreed examples as label references. Record the owner-priority rationale
separately from feature calculations. Vary counts, timing, and cost around the
examples. Never label cases from the fitted model score. A single small late
payment need not force B or C; repeated or substantial delays deserve more
review. Mixed concerns can increase priority. These are synthetic priorities,
not claims about measured business rates or actual building condition.

Save raw tenant, room, activity, plan, and coverage files, snapshot inputs, labels, feature
files, a dictionary, seeds, and a generation manifest. Keep dataset generation
outside app startup. A guarded non-production demo import can set historical
fixture dates; normal manual-create completion dates remain server-owned.

### 3.5 Model comparison and grade calibration

On 24 November 2026 the user approved the boosted-tree candidate to replace
Isolation Forest v2. The classifier uses the existing engineered inputs and
the number of settled rent payments made after their due dates. It uses the
same observation window and eligibility rules. It learns from synthetic A/B/C
labels. The stored score is an expected grade index from 0 to 2. The score
orders tenants within a grade and model version.

Fit on eligible snapshots in the 420-tenant training split. Use the
90-tenant validation split and ten known cases to choose two grade
boundaries. Keep each tenant and related room group in one split.
Train with the parameters and boundaries in the reviewed evaluation record.
The score and cutoffs belong to that model version.

Use fresh held-out tenant groups for the paired comparison. The approved
candidate scored 107 of 107 Grade C snapshots correctly and flagged 8 of
2,140 ordinary snapshots, compared with 101 and 28 for Isolation Forest v2.
Both fresh test sets use the synthetic generator. Review the input facts
before acting on a grade. Retain the results for earlier versions.

### 3.6 Predictions, facts, and persistence

Keep direct overdue rent facts and existing open-work attention visible even
when no grade is available. No automatic overdue-to-C override is proposed.
Completed repairs can contribute to a recent pattern without implying that a
fault remains open. Scores may improve as incidents leave the windows; settling
a payment does not erase past delay.

Show facts such as '3 repairs in 90 days' or 'Rent is 14 days overdue', with
authorized record links. Keep all three areas available and show up to three
summary reasons. These are recorded facts, not exact model attribution.

Propose these app-owned records using normal table/schema/entity ownership:

| Record | Stored values and constraints |
|---|---|
| tenant_detector_coverage | Retired confirmation records retained for history. |
| tenant_detector_state | One row per tenant: source revision, pending flag, last attempt, error code, latest prediction reference. |
| tenant_detector_predictions | Immutable asOfDate, generatedAt, tenant/source revision, input hash, model/feature versions, compact input snapshot, observation start, eligibility reasons, features, score/grade when eligible, and factual reasons. Unique on tenant, date, input hash, and artifact version. |

Input snapshots omit descriptions, receipts, and personal tenant details. The
prediction retains its tenant reference and the source activities' room links.
Tenant IDs never enter the numerical feature vector. Retain history for
the demo without automatic deletion. Block room deletion when detector records
exist, with a clear message. Browser writes cannot supply grades or scores.
Internal jobs use a separate credential, not an owner session.

## 4. User journeys and workflows

### Owner review

1. Open the existing dashboard. Add the current tenant's grade to an occupied
   room while preserving occupancy, links, and layout. A vacant room has no
   current tenant grade. The same tenant's grade can appear on multiple rooms.
2. Review a priority list below Needs attention: C, B, A, descending score within
   each grade, then stable tenant-name order. Show each tenant once, with eight
   entries and the total. Ungraded overdue rent remains in the existing due list.
3. Open the tenant profile for the grade, window, saved time, facts,
   refresh state, activity history, and prediction history. Room detail shows a current
   tenant summary and links to that profile. Show source rooms beside reasons.
4. Read prior results with their dates while refresh runs. Current overdue facts
   still come from current records.

Use existing Loom surfaces, app tokens, and language. No new top-level model
page is needed. Financial filters do not change the detector window. Pi reads
saved authorized results; chat does not trigger training or change grades.

### Service and route proposals

Use a small Python service under services/models. Shared feature code is
imported by notebooks and serving. Train offline; deploy a reviewed artifact
with feature order, parameters, boundaries, dataset manifest, versions, and
checksum. Load only our own trusted artifact in a pinned environment.

Start one worker with one inference thread. Workers AI embeddings and Vectorize
remain hosted as agreed. The model service needs no app database credential;
the API sends compact inputs. Keep the service URL and bearer credential in
server environment values. Use HTTPS when the app API is outside the VPS.

| Private service route | Result |
|---|---|
| GET /health | Readiness and loaded model/feature versions, without app data. |
| POST /tenant-detector/score | Accept versioned assessment dates, recording-window inputs derived by the app, compact attributed activities, and recurrence-completeness evidence for at most 25 tenants. Return eligibility, features, facts, and score/grade when eligible. |

| Authenticated app route under /tenant-detector | Result |
|---|---|
| GET /detail/:tenantId | Latest tenant result, freshness, and current authorized overdue facts. |
| GET /list | Saved tenant priority projection, associated rooms, reasons, window, and freshness. |
| GET /history/:tenantId | Paginated saved results, newest first. |

Use existing Sprindle scopes, permissions, schemas, and the app action adapter.
No framework changes are proposed. Concrete HTTP adapter, package pins, SQL
index names, and internal file names can be resolved during implementation.

### Refresh and failure behavior

Relevant activity writes transactionally mark affected old and new tenants pending
and increase their source revision. Include category, room, completion/payment
state, attribution, amounts, dates, and generated occurrences.
Recurring-plan changes queue their attributed tenant after generation. Renames refresh
display labels without model retraining.

A VPS job calls an authenticated internal app batch operation every minute.
At 00:10 Asia/Jakarta it also queues the daily refresh. Catch up recurrence
first, read inputs and source revision from a consistent database snapshot,
call the model outside that transaction, then save. If the revision changed
during inference, leave the tenant pending and do not publish that result as
current. Clear pending only for a matching revision.

The daily pass queues current tenants once each. A new occupant assignment
queues that tenant with its existing history. The worker also queues saved results from before the switch to recorded history.

Use locks and unique prediction keys for repeat-safe processing. Work survives
restart in the database. Process at most 25 tenants per batch, with one service
request at a time and a 10-second timeout. Retry failed tenant assessments on the next pass
and cap repeated error logs. Report pending work, failed attempts, and source revisions separately.

| Condition | Result | Next step |
|---|---|---|
| No saved result | Waiting for the first assessment. | Check after the next refresh. |
| Missing inputs | Save Not enough data and show current overdue facts. | Record missing source events or amounts when available. |
| Service failure | Keep the last valid result with stale/error state. | Background retry; activity entry stays usable. |
| Source changes during scoring | Keep the previous result and pending state. | Score the new revision. |
| Job stopped | Queue the current date after restart. | Resume without inventing missed historical predictions. |
| Artifact changes | Queue current tenants; preserve old results and versions. | Display new results as they arrive. |
| Access denied | Standard denied response without model data. | Other permitted functions remain usable. |

## 5. Review and handoff

The proposals above cover the remaining tenant-assessment decisions. Routine
implementation details can be handled within this contract. New business
behavior or a required departure returns for review.

See the [delivery plan](implementation-plan.md) for order and proof. This work
created no model code, migrations, packages, datasets, jobs, or deployment.
Dataset size, repair costs, feature formulas, permissions,
routes, release targets, and refresh mechanics remain Draft for later review.

## References

- [Current model and evaluation](../../services/models/model-card.md).
- [GroupShuffleSplit](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GroupShuffleSplit.html): group split mechanics; separating generator groups is our additional rule.
- [Model persistence](https://scikit-learn.org/stable/model_persistence.html): artifact trust and compatible serving environments.
- [Dataset review](../anomaly-dataset-review.md): public-source fit and synthetic-data rationale.
- [Dashboard](../dashboard/design.md) and [Rooms](../rooms/design.md): existing surfaces and owners. New detector details are proposed here.
