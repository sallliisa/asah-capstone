# Activities verification

## Development setup

The configured development target is the existing Neon neondb database. The read-only inspection found the four existing migrations and the expected room and identity tables. No schema/history mismatch was present.

Migration `20261109130315_activities-and-recurring-plans` adds activities and recurring_plans with their checks, references, and unique occurrence index. SQL review found no unrelated table change or data deletion. The migration was applied successfully. New management permissions were seeded through seedAuthorization. No sample financial activities or recurring plans were inserted into development.

## Checks

- API type check passed. The API owner ran the normal package script after source completion.
- API lint passed.
- SDK type check passed.
- Normal web type check passed. A final direct vue-tsc check covers the create preset and fixed financial-list query scope. Shared filter query types match the narrowed list transport schema.
- Full web lint and formatting passed. Lint reported 14 existing warnings in unrelated files and no errors.
- Focused API suite passed 7 tests in activities.routes.spec.ts and recurring-plans.routes.spec.ts. The guarded test target is the separate local carta_api_test database.
- Focused web schema suite passed 6 tests. These protect hidden-field clearing, independent work/payment states, purchase defaults, receipt wire values, and query conversion.
- git diff --check passed.

The API tests drive real production routes and read persisted rows. Recurrence tests call the same production generator used by the server. They distinguish fortnightly dates, leap-month clamping with original day restoration, concurrent first generation, inactive plans, and a backlog that needs two bounded passes.

The form tests use the real application schemas. No framework behavior, mock persistence, or copied field inventory is asserted. No framework packages were changed.

## Server runtime

The existing test seed prepared an administrator. An owned loopback server on port 5190 loaded 47 routes and started the recurring worker. The existing doctor verified the process working directory, port ownership, test database, seeded administrator, health response, and anonymous access denial.

Additional anonymous HTTP requests to activities/list, activities/summary, and recurring-plans/list each returned 401. No recurring worker startup error appeared. The owned server was stopped after the check; the user's existing preview servers were preserved.

## Source review

Only Activity owns room attribution. Income & Expenses reads the same resource and opens the same detail/editor. Its totals use settled money and the full server-side filtered set. Summary requests use the same query normalization as list requests. The financial-only page scope is excluded from user-controlled list query fields, so a URL cannot turn Income & Expenses into a non-financial list. No-finance activities clear every financial value. SQL checks reject zero amounts and missing payment state for financial records.

Recurring generation locks a plan, inserts unique occurrences, and advances its cursor within one transaction. Each due plan can generate at most 100 occurrences per pass. The worker checks at server startup and each minute, and reports failures. Month recurrence retains the original start-day anchor. Generated activities retain their own work and financial history when a plan changes its template or becomes inactive.

Initial web checks found renderer literal widening, cross-package Zod issue types, and a TypeScript expansion limit. The final resource keeps the shared filters at the ListView pages, which avoids the expansion while retaining one shared filter definition. No type cast or framework patch was added to solve the limit.

## Limits

Browser inventory returned no connected browser. Native browser input timed out in the existing session. Rendered layout, conditional control interaction, and the real receipt upload/provider path are unverified. Form conversions have focused lower-boundary proof; they do not establish browser behavior or provider availability.

Occupant reporting remains outside this delivery. Multiple payments, rent charges, and unpaid-rent balances remain outside the approved Activity contract.

Evidence is stored under .local/verification/activities/ and .local/verification/activities-*.log. Initial local test preflight failed because PostgreSQL was stopped. Starting the existing local service resolved the prerequisite. The service is returned to its original stopped state after verification.

## Approved date simplification

Expected date is now the existing read-only occurrenceDate from a recurring plan. The duplicate scheduled_date column, its editable field, and its sorting contract were removed. Activity write schemas also reject client-owned completion and occurrence dates. No compatibility alias was added.

The development target had zero activities and five applied migrations before this change. Migration `20261109134002_activity-expected-date` was reviewed and applied successfully. Its guard blocks migration when an old scheduled_date differs from occurrence_date. A separate real PostgreSQL proof used connection-local temporary tables to confirm both mismatch rejection and successful duplicate-column removal without losing the retained occurrence date. No public data was changed by that proof.

Completion dates now come from the server's Asia/Jakarta date on completion. Updates retain the date while work remains completed. Reopening clears it; completing again records the new date. Settled income and expenses default missing actual dates to today, retain their dates on unrelated edits, and permit explicit backdating. Labels are Date received for income and Date paid for expenses. Mixed lists and filters use Actual date.

The web form no longer submits or shows expected/completion date inputs. Settled drafts receive today's actual date without resetting saved dates. Expected date appears once in the standard detail and table; ad-hoc records show the normal empty value.

The final focused API suite passed eight tests after the custom insert-row parser change. Eight focused web schema tests passed. Fixed Date clocks cross the Jakarta date boundary and use explicit expected dates. API, SDK, and normal web type checks passed. Scoped lint and formatting passed. git diff --check passed. Source changes stay in the Activity module, recurrence generator, their tests, and the new migration.

Browser interaction remains unverified under the existing connector limitation. Date-specific evidence is in .local/verification/activity-dates/ and .local/verification/activities/date*.log.

## Mastered categories and shorter manual creation

Activity Categories now owns unique category names. Activities and recurring plans store categoryId references and return categoryName for display. Category is independent of money and remains visible/stored when Financial details is None. General is the default and cannot be deleted; referenced categories are also protected. Category choices require the corresponding activity/plan read permission, without granting master management access.

Manual creation now accepts no work-status or payment-status fields. The server records Completed work and Settled income/expenses. No-money activities have no payment state. Existing records retain follow-up controls on Edit, and recurring generation still creates Planned work with Draft money. Date paid and Date received remain editable and default to today.

The Activity create form order is Name, Category, Room, Description, then Financial details and its conditional money fields. Edit keeps the stable activity fields first and follow-up controls afterwards. Recurring Plans also keeps Description before the conditional financial template. Thus changing financial involvement expands only the lower form fields.

Migration `20261109135914_activity-categories` was applied to development after six existing migration records and zero activity/plan records were confirmed. It creates General and distinct trimmed legacy category names, backfills both reference columns, and then removes legacy text columns. The exact SQL passed a real PostgreSQL proof in a rolled-back isolated schema with four legacy activities and two plans. Names, amounts, and existing work states were retained, matching trimmed names merged, and uncategorized rows mapped to General.

The existing seed installed category permissions and the General default. Repeated seeds preserve category renames. No sample activity or plan was inserted into development.

The focused API suite passed 10 tests across Activities, Recurring Plans, and Activity Categories. The focused web schema suite passed 10 tests. These cover authoritative manual-create states, independent follow-up, nonfinancial category retention, category rename/filter/reference rules, picker access, money dates, and outgoing create payloads without statuses. API, SDK, and normal web type checks passed. Scoped lint and formatting passed; git diff --check passed.

Category options use the activity-categories cache owner. Master saves invalidate the related Activity and Recurring Plan reads and have an explicit saved-record navigation target. Standard Views and controls are used. Browser interaction remains unverified under the existing connector limitation.

Evidence is in .local/verification/activity-categories/, .local/verification/categories/, and .local/verification/category-api-*.log.
