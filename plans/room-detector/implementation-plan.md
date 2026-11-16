# Tenant attention grade: delivery plan

Status: Approved. Implementation: In progress.

Review [the design](design.md) first. The user approved this work order and authorized implementation.

## 1. Dataset and feature calculation

Create fictional tenant and room histories, a dictionary, generation manifest, independent
splits, and snapshot labels. Build one feature calculator for training and
serving. Keep the synthetic assumptions visible.

Check fields against the Activity contract. Check known zeros, unknown money,
no grace period, date boundaries, partial coverage, late payments later settled,
and independent work/money dates. Use separately calculated expectations for
hand-reviewed tenants. Verify tenant and related room-group separation, moves
without resets, stable historical attribution, and future-event exclusion.

Deliver the dataset and notebook before app integration.

## 2. Model comparison

Run baseline, engineered, and tuned experiments with fixed splits. Select the
model and boundaries using validation data. Report held-out metrics, failures,
confusion matrices, and representative errors. Check isolated repairs, extra
cleaning, expensive planned upkeep, and recovery.

Deliver the notebook, experiment table, reviewed artifact, checksum, and model
card. Measure service latency and memory on the VPS before deployment. If useful
grade ordering cannot be achieved, report it and recommend a focused revision.

## 3. Storage, service, and refresh

Add the reviewed coverage, refresh, prediction history, routes, and service.
Add the historical tenant reference to activities and rent plans, correction
audit, and preservation rules. No stay table or duplicate activity is needed.
Review migration effects against the actual target before applying them. Any
demo fixture import must be explicit, non-production, and repeat-safe.

Use Carta module development, API, verification, and test-audit skills. Select
meaningful behavior proof before writing tests. Prove persistence, access
denial, missing history, feature parity, source changes during inference,
recurrence catch-up, restart recovery, and repeat-safe refresh. Preserve
unrelated records and user work.

## 4. Existing web surfaces and Pi

Connect tenant profiles, current-tenant room summaries, and dashboard priorities through existing transport
and Loom surfaces. Check coverage editing, result history, stale/error states,
fact links, and independent occupancy/financial filters. Check iPhone layout
and wider screens. Connect Pi reads when CloudflareOS is ready.

Prove ordinary activity/payment entry stays usable during a model outage.
Run API, SDK, and web checks appropriate to changed owners, and record browser
results, deployment/job proof, failures, and limits in a verification document.

## 5. Submission record

Revise the formal model scope to the agreed tenant-associated assessment. Use monthly
rent and four-month AC examples. Document the dataset, model comparison, grade
calibration, API, serving, and assumptions. Reuse credible existing proof.
Synthetic evaluation does not establish real-world accuracy or business impact.
