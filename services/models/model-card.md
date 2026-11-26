# Tenant attention model v3

The model uses recorded repair, cleaning, and rent activity to give tenants an
owner review priority. Grade A means Routine, B means Check soon, and C means
Check first. The owner checks source records before acting on a grade.

## Training

A histogram gradient-boosted tree classifier learns A/B/C from synthetic labels.
Its inputs are the nine previous model features and the count of settled rent
payments made after the due date. The same feature calculator supplies training
and serving. The model score is the expected grade index from 0 to 2. Compare
scores within one model version.

Fit on the 5,560 eligible training snapshots. Select boundaries on the
validation split and ten known cases. Both previously under-ranked repair cases
now receive the expected grade. The ten cases helped choose the boundaries.

## Fresh synthetic comparison

Both models scored the same 2,371 eligible snapshots on two held-out seeds.
Group tenant histories by tenant to keep related snapshots together.

| Measure | Isolation Forest v2 | Boosted trees v3 |
| --- | ---: | ---: |
| Grade C recall | 101/107 | 107/107 |
| Ordinary snapshots flagged as B or C | 28/2,140 | 8/2,140 |
| Macro F1 | 0.7142 | 0.9832 |

The held-out sets use the same synthetic generator. Real-tenant accuracy remains
unmeasured. The [reviewed evaluation](evaluation.json) records the model
parameters, dataset hashes, cutoffs, and confusion matrices. The [v2 report](evaluations/tenant-v2.json)
retains the earlier comparison.

## Serving

The service checks the artifact checksum, feature order, model classes,
boundaries, and scikit-learn version. The API saves each result with the
model version and recalculates when the active version changes. Saved reports
keep their original grades and scores.
