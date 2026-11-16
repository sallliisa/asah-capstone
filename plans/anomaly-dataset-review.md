# Room detector: dataset check

Reviewed: 2026-11-17. Research only; no model or application implementation.

## Result

No training dataset was present in the reviewed project files. FMUCD and MASSIVE
were candidates from the earlier discussion, not selected training data.

The proposed full room detector cannot be trained directly from FMUCD. Its
published schema describes buildings and maintenance work, without rent-payment
history or a room identifier. The newer sources below support parts of the
feature set, but none checked here provides a complete shared history of room
repairs, cleaning, and rent.

The user's constraint is now part of the design: every model input must have a
verified training source and an equivalent value at application scoring time.
Hold unsupported variables outside the learned grade. Synthetic data remains
allowed, but choosing a synthetic dataset or generating one is a separate
decision; it does not establish support in a public dataset.

## Evidence and limits

- Read the [FMUCD dataset page](https://data.mendeley.com/datasets/cb8d2nsjss/1)
  and the authors' [published variable table](https://pmc.ncbi.nlm.nih.gov/articles/PMC11465139/#tbl1).
  The direct public API request returned HTTP 403. Raw CSV contents, missingness,
  and the presence of cleaning records remain unverified.
- Downloaded six small CSVs from the publishers of the synthetic datasets below.
  Parsed all rows, counted missing values, and checked columns and date ranges.
  All six hashes matched the SHA-256 values on their dataset pages.
- Retrieved the official NYC HPD schema and a bounded sample of 1,000 recent
  problem rows. This is not a profile of the full historical dataset.
- Research evidence and source URLs are in
  `.local/research/anomaly-data-2026-11-17/`. No dataset was imported into the
  application database and no model was trained.

## Proposed signals against FMUCD

| Signal | Source support | App fit and decision |
|---|---|---|
| Repair frequency | Dates and building identifiers support building-level counts. | Room-level training is not established. Renaming a building to a room does not resolve the difference. |
| Planned versus corrective maintenance | `PPM/UPM` is documented. | The app has categories and recurring-plan references, but no explicit equivalent classification. Recurring does not always mean preventive, and manual does not always mean corrective. Mapping remains open. |
| Maintenance costs | `TotalCost` is documented. | Public costs are USD and relate to campus work; app amounts record money for activities. Define matching cost meaning and comparable scale before use. |
| Repeated component work | Component categories and dates are documented. | Category repetition is possible; repeated failure of the same physical AC unit is not established by a component classification code. |
| Repair duration | `WOStartDate` and `WOEnd Date` are documented. | The app has no actual work-start date. An expected date is not a start date. Exclude duration from the current feature contract. |
| Cleaning frequency | A verified cleaning subset has not been established. | Hold until actual categories and records are checked, or use a selected synthetic source. |
| Overdue cleaning | A scheduled cleaning deadline is not established. | Do not derive lateness from work duration. Hold outside the model trained on this source. |
| Rent delays and nonpayment | No corresponding fields in the documented schema. | Exclude from a model trained only on FMUCD. |
| Tenant changes or tenant-specific behavior | No tenant history in the documented schema. | The app also lacks historical payment-to-tenant attribution. Exclude. |

The exact documented fields come from the authors' variable table linked above.
No A–C room-priority labels or verified anomaly labels are established by this
review. Work-order priority and facility-condition measures are different
targets and must not be relabelled as our room grades.

## Other sources checked

### NYC HPD residential complaints

[Housing Maintenance Code Complaints and Problems](https://data.cityofnewyork.us/Housing-Development/Housing-Maintenance-Code-Complaints-and-Problems/ygpa-z7cr)
is described by the [publishing agency](https://www.nyc.gov/site/hpd/about/open-data.page).
The retrieved schema includes apartment and building identifiers, received
dates, problem categories, status dates, and duplicate flags. This is a closer
real-data candidate for repeated residential problems than university buildings.

The 1,000-row sample had 864 distinct complaint IDs and 279 rows marked as
duplicates. It covered less than one day. Count problem rows carefully: one
complaint can contain multiple problems, so raw row count is not incident count.
The sample contained unsanitary-condition reports, which are not completed
cleaning-task records. These observations do not establish full-history quality.

No cost ledger, rent payments, planned cleaning schedule, or exact A–C targets
were present in the schema. Complaint receipt and status dates also differ from
the app's completed-work and payment dates. The schema metadata did not supply
a license ID; review NYC's dataset terms before selecting it for reuse.

### Apartment leases and rent payments: public synthetic data

The [publisher's dataset](https://databasesample.com/datasets/apartment-leases-tenants-and-rent-payments-dataset)
lists CC0. Actual CSV inspection found 552 payments and 46 leases. Payments have
`due_on`, `paid_on`, amount due, and payment state; leases link to units and
tenants. There were 514 paid rows and 38 unpaid rows with absent paid dates.

It supports payment-delay and nonpayment calculations within its own synthetic
history. The publisher describes limited, generated delay patterns. It does not
provide maintenance or cleaning for those same units. This is a useful schema
and calculation example, not evidence of real tenant behavior or a complete
training set for the room detector.

### Hotel housekeeping task board: public synthetic data

The [publisher's dataset](https://databasesample.com/datasets/hotel-housekeeping-task-board-dataset)
lists CC0. Actual CSV inspection found 120 tasks and 600 events. Tasks have room
references, task types, and trigger timestamps. Events record five stages and
inspection results. Every task had each stage through inspection. Dates covered
six days.

It supports counts and event-cycle calculations within that short sample. It has
no explicit cleaning deadline, repair-cost ledger, rent history, or unresolved
task examples. Our app also does not capture cleaning inspection scores or
actual work-start timestamps. Exclude those inputs from an unchanged app.

### Rental Management: public synthetic data

The [publisher's dataset](https://databasesample.com/datasets/rental-management)
lists CC0. The inspected files had 100 maintenance requests and 300 payments.
Requests have a unit reference, date, description, and priority. Payments have
an amount and payment date but no due date. Maintenance descriptions were
missing in 12 rows and the schema had no cost or completion fields.

Despite the combined domain, it cannot establish payment delay or a complete
maintenance/cleaning history. Do not invent due dates from payment dates.

### Hotel maintenance complaints

The [publisher's viewer](https://huggingface.co/datasets/Amey9766/Hotel-maintenance-complaints-dataset)
shows complaint text, area, category, priority, department, and estimated
resolution hours. No stable room/time history or repair-cost fields appear in
that schema. Visible examples also contain category/text mismatches. This source
is not selected for longitudinal room anomaly training.

## Selected direction after review

The user selected the complete room detector after this review. Prepare one
coherent synthetic room history
using the app's observable fields. Use public sources only where their records
or distributions fit, and identify any adaptations as synthetic. Keep every
feature traceable to both that dataset and the app. Repairs, cleaning, and rent
are included in the intended scope. Define the dataset/feature contract before
generating records or training. The exact combined-grade rule remains open.

For a public-real-data route, investigate the NYC residential complaint history
next and narrow the model to features it actually supports. Maintenance costs,
rent, and cleaning deadlines would remain outside that learned score unless a
compatible source is found. This narrower route was considered and not selected.

Do not join unrelated room identifiers across the rent, housekeeping, and
maintenance sources. Such a join would create synthetic room histories and must
be designed and labelled that way. Do not fill an entirely absent feature with
zero and claim the public data trained it.

Isolation Forest can learn from unlabelled feature vectors. The assignment's
precision, recall, and F1 comparison still needs separate evaluation labels or
labelled simulation scenarios. A–C thresholds require validation; none of the
checked sources directly supplies our agreed grades. See
[scikit-learn's anomaly-detection guide](https://scikit-learn.org/stable/modules/outlier_detection.html).
