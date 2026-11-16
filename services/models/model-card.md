# Tenant attention model v2

This Isolation Forest estimates unusual recorded owner-attention workload.
A/B/C grades are review priorities. They do not prove tenant fault. The model
uses synthetic records and needs manual review before business decisions.

## Data and selection

The second dataset has 600 fictional tenants over 18 months. Groups remain in
one 420/90/90 tenant partition. The seed is 2992027. The revised
generator includes short bursts and longer periods of incidents. The v1 report
and failed scenario review remain in evaluations. No real tenant data was used.

Fourteen candidates include the raw baseline, engineered features, and twelve
parameter combinations. Labels do not enter Isolation Forest fitting. Validation
macro-F1, C recall, and tree size select parameters and grade boundaries. Final
test data does not select the model. Candidate tuned-200-512-1.0 was selected.

## Results and limits

The fresh final test has 1164 eligible snapshots. Binary
F1 is 0.9212. C recall is 0.8427,
below the 0.85 target. Ordinary false positives are
2.47%. All results and errors are retained
in evaluation.json. We did not force a target pass or add a grade override.

The ten known scenario regressions now match
8 expected grades. Three recent repairs
still receive A and six repairs in sixty days receive B. The cleaning burst
cases improved. These known cases informed dataset review and are not new
held-out evidence. No further selection uses the final test. A further change
requires a new test set and must preserve these reports.

The model is an experimental review candidate. Isolation Forest abnormality
does not always order severity as the owner expects. A focused future revision
could compare a supervised ordinal classifier if exact review-priority ordering
is required. That would change the approved estimator and needs design review.
Current direct overdue facts and source records remain available independently.

Snapshots from a tenant are correlated. Both partitions use one generator with
separate identities, room groups, seeds, and histories. This does not establish
real-world accuracy. Monthly rent and no grace period are used. Routine cleaning
and scheduled servicing are excluded from adverse inputs. Room moves do not
reset tenant history. The score is negative score_samples, not a probability.

## Serving

Serving verifies the artifact checksum, feature order, and sklearn version.
The service has no database credentials. The API retains immutable inputs and
results, rejects stale revisions, and keeps the last result during outages.
VPS latency/memory and live browser acceptance are still pending.
