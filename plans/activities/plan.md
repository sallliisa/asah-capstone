# Activities delivery

## Feature steps

1. `how` over the affected subsystem.
2. `architect` for parallel design exploration.
3. Write the throughput checkpoint as four todo items.
4. Delegate code-writing to a subagent with a specific scope.
5. Verify on the matching surface.
6. Rebase into small, ordered commits. Skip commits because the user has not requested Git publication and the workspace contains unrelated local work.
7. If the design is contested, `interrogate` before shipping.
8. Run Opening a PR. Skip because no PR was requested.

## Architecture phases

- Ground. Existing Carta resources bind API schemas and transport to standard Views. The existing room module owns room identity. Authorization catalog and system seed own management access.
- Sketch. Candidate A uses one activities table with financial columns guarded by a discriminator. Candidate B uses an activity table and an optional financial child row.
- Agree. The user approved Activities with optional financial details. No further approval is needed.
- Implement. API and web owners use one agreed public contract.
- Scrap. Revisit only if implementation cannot enforce the agreed states without extra ownership.

## Arena result

Frame, Fan out, Cross-judge, Pick, Graft, and Verify apply to the architecture sketch. Two read-only candidates and a separate judge compared the sketches.

The rubric checks one room owner, no zero-cost placeholder for cleaning, simple one-save purchases, independent work and payment states, and repeat-safe recurring generation.

Candidate A is the base. Both the parent and judge selected it. All financial columns are null when the activity has no financial details. Candidate B adds custom aggregate persistence without a current need for multiple payments. Its bounded backlog and original calendar-day recurrence anchor are retained. No competing implementation trees are needed for this fixed contract.

## Throughput checkpoint

- Blocking first steps. Read existing contracts and agree the schema, authorization, and recurrence rules before the pages depend on them.
- Independent workstreams. One owner writes API modules and route tests. Another writes web resources and pages. The parent reviews and verifies the combined result.
- Shared mutable state. Only the API owner changes the catalog, domains, server startup, and new migration. Only the web owner changes navigation and generated web route names. Database runs remain serial.
- Smallest safe decomposition. Two owners split API and web files. One API owner keeps recurrence and activity writes under the same rules.

## Selected proof

- Real route/database tests prove financial state validation, independent work/payment states, scoped access, summary filters, and persisted changes.
- Real recurrence operations prove fortnightly and calendar-month dates, duplicate prevention, disabled plans, and cursor advancement.
- Standard Views and controls use existing framework coverage plus API, SDK, and web type checks and app lint.
- Browser proof targets financial form visibility, one-save purchase entry, no-finance cleaning, and the same record reached from both menus.
- Inspect the development target and migration history before applying the new migration. Seed new management permissions through the existing authorization seed.

## Current status

API and web implementation and development setup are complete. Browser and live upload proof remain blocked. Design implementation status remains In progress until that selected proof is complete.

## Date simplification

The user approved one Expected date for scheduled activities, actual money dates with today defaults, and automatic work completion dates.

- Blocking first steps. Inspect existing date data before removing the redundant scheduled_date column. The development target has zero activities and five applied migrations.
- Independent workstreams. One API owner changes write boundaries, date rules, migration, and real route tests. One web owner removes manual schedule/completion controls and updates actual-date labels and conversions.
- Shared mutable state. The API owner alone edits API date contracts and the migration. The web owner edits only web resources, schemas, and their tests. The parent owns database writes and serial checks.
- Smallest safe decomposition. Reuse occurrenceDate as the read-only Expected date, rather than adding a second source or an alias. Keep paymentDate storage and change its user-facing labels.

Selected proof uses existing real route tests with fixed dates for server defaults and retained history, plus application schema tests for outgoing form values. Recurrence tests confirm the generated expected date remains immutable. Normal API, SDK, and web type checks and focused lint cover the changed boundaries. Browser verification remains subject to the existing connector limitation.

## Mastered categories and simple creation

The user requests Activity Categories for all activities, a completed/settled manual create flow without status controls, editable actual dates, and stable form order.

- Blocking first steps. Read current category data and migration history. Development has six applied migrations and no activity or plan rows.
- Independent workstreams. One API owner changes category storage, migration, create rules, and real route tests. One web owner changes master pages, form schemas, stable field order, and focused conversion tests.
- Shared mutable state. API owns the catalog, domains, seed, and migration. Web owns navigation and route generation. Parent applies migrations and runs database checks serially.
- Smallest safe decomposition. Category is one master reference on an activity and one template reference on a plan. Create and edit use separate command/schema shapes so status controls are absent from create without hidden workflow state.

Selected proof covers real CRUD/reference guards, renamed labels, category filtering, recurrence template copying, authoritative create defaults, and independent edit states. The exact migration was executed against a rolled-back isolated schema with legacy data to prove preservation. Normal owner type checks, lint, and schema conversion tests cover the standard Views and input ordering. Browser interaction remains unverified under the existing connector limit.
