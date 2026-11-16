# Tenant attention grade: example histories

Status: Draft for discussion, 17 November 2026.

These are proposed owner-priority labels for synthetic examples. They are not
model predictions or fixed grade rules. No records have been generated or
inserted into the app. The approved measurements and scoring approach are in
[the working notes](capstone-working-notes.md#detector-measurements-and-scoring-approved-direction).

Assess each example as a tenant's associated history across rooms. Source room
links remain visible, but moving rooms does not reset the grade. Each example
uses one room unless specified. Tenant identity is not a numerical feature.

## Shared conditions

Rent is paid monthly.
There is no payment grace period. Payments after the expected date are late;
unpaid rent is overdue from the following date. Lateness does not automatically
force C; severity and repetition still matter.
AC servicing is every four months per room. Routine cleaning is roughly twice
a month with flexible dates. Extra cleaning is anything outside that routine.

Except for the short-history case, each room has six months of confirmed,
complete recording coverage and six monthly rent occurrences of Rp1,500,000.
Routine cleaning follows that approximate frequency, without fixed work
deadlines. Rent is recorded as income with expected and actual money dates.
All other rent is settled on time. Counts refer to distinct activities, not
duplicate entries.

Repair and extra-cleaning counts below refer to completed work. Stated repair
expenses are known settled expenses. An unstated amount must not become zero
in the eventual feature calculation. Expensive planned servicing has its own
category and is not a corrective repair.

For ordinary synthetic rooms, use 0–2 corrective repairs per year, usually
0–1 in a 90-day period, and 0–1 extra cleanings per 90 days. Events have varying
dates rather than fixed intervals. These are approved synthetic assumptions,
not measured business rates. A/B/C meanings remain settled; the numerical
examples below guide evaluation rather than hard-coded grade rules.

The user approved the ordinary repair and extra-cleaning frequencies and their
B/C frequency examples. Other example labels remain draft for discussion.

## Proposed examples

| Case | Recorded history | Target | Reason for owner review |
|---|---|---|---|
| Ordinary room | No corrective repairs or extra cleaning. Routine cleaning occurs roughly twice a month, and six rent payments are on time. | A · Routine | Complete coverage with no concerning pattern in the selected measurements. |
| Occasional repair | One completed corrective repair in 90 days, without unusually high recorded repair expense. Cleaning follows the usual routine and rent is on time. | A · Routine | One isolated resolved incident need not establish a problematic pattern. |
| Occasional extra cleaning | One completed extra-cleaning activity in 90 days. Routine cleaning, rent, and repairs otherwise follow the ordinary pattern. | A · Routine | An isolated extra cleaning is included in ordinary synthetic histories. |
| Repair pattern to review | Three corrective repairs in 90 days, with Rp1,200,000 in recorded settled repair expenses. | B · Check soon | Several recent repair visits deserve review, without proof that the same asset failed. |
| Strong repair pattern | Six corrective repairs in 60 days, with Rp3,000,000 in recorded settled repair expenses. | C · Check first | More frequent recent corrective work and higher recorded spend than the ordinary histories. This does not prove a fault is still open. |
| Cleaning pattern to review | Three extra-cleaning activities in 90 days, in addition to the usual routine. | B · Check soon | Approved frequency example for evaluation. Repeated extra work deserves review; there is no cleanliness inspection result. |
| Strong cleaning pattern | Six to eight extra-cleaning activities in 90 days, in addition to the usual routine. | C · Check first | Approved frequency example for evaluation. More frequent extra work deserves earlier review; no work deadline is inferred. |
| Repeated late rent | Three of six due rent occurrences were settled five to ten days late. Nothing remains unpaid. | B · Check soon | Repeated delay is visible, but there is no current unpaid rent. |
| Substantial unpaid rent | Two due rent occurrences remain Draft and unpaid. The oldest is 45 days overdue; the known overdue total is Rp3,000,000. | C · Check first | The owner should review the recorded unpaid rent before the ordinary cases. This is a proposed evaluation label, not approval of an automatic overdue-to-C rule. |
| Planned upkeep | Rp3,000,000 of planned servicing, no corrective repairs, and routine cleaning roughly twice a month with varying dates. All rent is on time. | A · Routine | Planned upkeep expense and flexible routine-cleaning dates alone must not imply a problematic room. |
| No events, known coverage | No repairs or extra cleaning during the complete six-month period. Routine cleaning follows the usual practice and rent is on time. | A · Routine | Zero incidents is a valid value when recording coverage is confirmed. |
| Short history with a known problem | Only 30 days of reliable records and one due rent occurrence, still unpaid 14 days after its expected money date. | Not enough data | The full grade is unavailable. Show the factual 14-day overdue alert immediately. |
| Move with continuing history | A tenant has three repairs in 90 days across two rooms, with ordinary rent and cleaning. | B · Check soon | The aggregate history follows the tenant. The move does not reset it. |
| Replacement occupant | A different tenant takes over the previous room with 30 days of their own complete records. | Not enough data | The previous tenant's events and grade do not transfer. |
| Former tenant | The tenant moves out with unpaid rent and saved assessments. | Preserve the dated result | The owner can still read their history and follow up on that tenant's unpaid rent. |

The ordinary-room and known-zero cases intentionally have the same observed
signals. They check that the explanation distinguishes confirmed zero incidents
from unknown history. They are not separate statistical classes.

## How to use these examples

First agree on the relative priorities: stronger repair, cleaning, and unpaid
rent patterns deserve earlier review; planned upkeep alone does not. The
amounts and event counts illustrate those priorities. They are not universal
thresholds for all room types, rent intervals, or recording periods.

Next define histories around the boundaries: one isolated late payment,
payments settled after an overdue alert, old repairs followed by a quiet period,
mixed concerns across areas, different rent amounts, and incomplete records.
Any policy for an automatic severe-overdue grade remains a separate decision.

Create varied event histories only after the feature and coverage contracts
are complete. Keep independent room histories and scenario variations for
validation and final evaluation. Do not copy these exact templates into every
split or create evaluation labels from the fitted anomaly score. The expected
labels represent our review priorities; the model must be checked against them.

The A/B/C boundaries still need validation. If a rare but healthy planned-upkeep
case receives a high anomaly score, investigate the features and model before
accepting its grade. A factual alert and an anomaly grade remain separate
outputs.
