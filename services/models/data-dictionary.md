# Synthetic data dictionary

All IDs and histories in these files are fictional. Generate them with
kos-generate. The raw histories cover 18 months. They are model data, not a dump
of the application's current occupancy registry. Source contracts are the app's
Activity, recurring-plan occurrence, user, room, and coverage fields.

## Files and partitions

| File | Contents |
|---|---|
| data/histories.jsonl | One tenant per row: split, related room group, scenario family, room context, move/multiple-room flags, coverage, raw activities, and generation review evidence. |
| data/plans.jsonl | Expected monthly rent occurrences with tenant, room, due date, and amount. This is an expected-occurrence ledger, not an export of recurring-plan headers. |
| data/snapshots.jsonl | Monthly as-of inputs, eligibility, feature vectors, synthetic priority label, and its independent scenario rationale. Future terminal payment/work states are removed from snapshot inputs. |
| data/manifest.json | Seed, tenant/snapshot counts, partition counts, eligible label counts, and SHA-256 digests. |
| intent-dataset.jsonl | Indonesian question, intent, partition, and paraphrase/template group. |

Every tenant and related room group stays in one 420/90/90 tenant partition.
Monthly snapshots from a tenant are correlated. Room IDs and tenant IDs are
context links, not numerical model inputs. The intent dataset keeps each whole
template group in one 700/150/150 question partition.

## Compact Activity input

| Field | Type and meaning |
|---|---|
| id | Stable fictional activity identity; prevents counting the same record twice. |
| roomId | Source room identity. Shared activities without a room are excluded. |
| categoryId | Stable master identity for corrective repairs, extra/routine cleaning, planned servicing, or monthly room rent. |
| workStatus / completedDate | Work state and completion date. Completed-work counts use completion date, separately from money. |
| financialKind | none, income, or expense. |
| amount | Rupiah integer or unknown/null. Unknown amounts are not treated as known zero. |
| paymentStatus / paymentDate | Draft/settled state and actual cash date. Future cash is not settled at an earlier snapshot. |
| occurrenceDate | Expected date of recurring rent. Ad-hoc money has no lateness reference. |

Snapshot inputs are grouped by tenantId and asOfDate, with coverage and a
recurrenceComplete flag. Coverage has repairsFrom, cleaningFrom, rentFrom, and
repairCostsComplete. The usable window starts at the latest coverage date or
the day after one calendar year before asOfDate. Eligibility needs 90 observed
days, three due rents with known amounts, complete repair costs, and complete
recurrence generation. Zero known incidents differs from unknown coverage.

## Features and labels

The ordered nine features and six raw baseline features are defined in
src/kos_models/features.py and explained in the approved
[feature contract](../../plans/room-detector/design.md#33-feature-contract).
Repair/extra-cleaning counts use completed work. Repair spend uses settled cash.
Rates use 30 observed days. Rent is monthly with no grace period. A due-today
unpaid occurrence is not overdue. Planned servicing and routine cleaning do not
raise the numerical priority inputs. Future events are excluded.

A means routine review, B means check soon, and C means check first. Labels are
synthetic review priorities from event counts, current unpaid duration, and
repeated settled delays. They are not model scores or proof of tenant fault.
The generator stores its rationale independently from the feature function.
Incomplete snapshots do not enter fitting or eligible-grade metrics. Model
limits and errors remain in model-card.md and evaluation.json.

## Intent labels

| Label | Requested result |
|---|---|
| rooms | Room/tenant conditions, maintenance history, and attention. |
| schedules | Planned dates, upcoming activities, and notification schedules. |
| finances | Recorded costs, income, settlement, and overdue payment facts. |
| guidance | App instructions, concept explanations, and operating procedures. |
| out-of-scope | Requests unrelated to kos operations or app use. |

Each template has five object substitutions in its assigned split. The classifier
uses Indonesian only. Character features cover some abbreviations and typos.
Uncertainty calibration also uses incomplete-question validation probes. The
runtime returns clarification for rejected questions rather than choose a private
context. Read intent-model-card.md for coverage and class-specific limits.
