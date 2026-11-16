# Tenant attention model v1

This Isolation Forest estimates unusual recorded owner-attention workload.
Grades are review priorities. They do not prove tenant fault.

The dataset has 600 fictional tenants and 10,800 monthly snapshots. There are
420 training tenants, 90 validation tenants, and 90 final-test tenants. Related
room groups stay in one partition. There are 2752 ineligible
snapshots. No unknown coverage is replaced with zero.

Selection used validation macro-F1, then C recall, then tree size. The selected
candidate is tuned-200-128-1.0. Fourteen candidates include the raw baseline,
engineered features, and twelve parameter combinations. Labels do not enter
Isolation Forest fitting. They calibrate two ordered validation boundaries.

The final test has 1200 eligible snapshots. Binary F1
is 0.9773, C recall is 0.8629,
and ordinary false positives are 1.14%.
Macro-F1 is 0.8463. The three proposed targets passed for
this synthetic evaluation. B/C confusion remains: 15 B cases became C and
24 C cases became B. Read evaluation.json for all experiments and errors.

Snapshots from one tenant are correlated. These are snapshot metrics, not 1,200
independent people. Label thresholds are synthetic priority assumptions. Data
families share a generator across partitions, though identities, room groups,
random histories, and seeds are separate. This limits the strength of this
evaluation. Independent real-world data is not available. Hold-out scenario
review and VPS latency/memory measurements remain pending.

Serving verifies the trusted artifact hash, feature order, and sklearn version.
The abnormality is negative score_samples, not a probability. Routine cleaning
and planned servicing are excluded from adverse inputs. A move does not reset
the tenant's associated history. No model retraining occurs in normal requests.
