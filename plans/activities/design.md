# Activities and recurring plans

Design: Approved
Implementation: Needs update

Existing behavior and the tenant-history direction retain approval. Attribution
and rent-plan details below are the proposed contract for this workstream.
The [tenant assessment](../room-detector/design.md) consumes these records.
No tenant-attribution implementation is present yet.

The user approved this document and authorized implementation at the checkpoint.
Earlier draft labels describe proposals now included in that approval.

## 1. Purpose and scope

Record work and money in one Activity. Show financial activities in Income & Expenses without another transaction record. Generate routine work from recurring plans.

Included:

- Activities list, create, detail, and edit.
- Income & Expenses as a filtered view of the same activity records, with totals and filters.
- Recurring Plans list, create, detail, edit, and automatic due generation.
- Optional room and receipt links. Separate work and payment states for follow-up.
- A historical tenant reference alongside the room, without a duplicate activity.
- Tenant-bound rent plans, stable past associations, and audited corrections.
- Activity Categories master data for all activities and recurring plans.
- Management permissions through the existing authorization catalog.

Excluded:

- Occupant reports and requests. The user originally deferred reporting; no later instruction explicitly added it to this session.
- Rent charges, unpaid rent balances, payment allocations, multiple payments per activity, financial statements, and external accounting integration.
- New room or occupant workflows.

The earlier Activity scope retains its approval. The new historical tenant
contract remains Draft for review. This document does not start implementation.

## 2. Functional requirements

| # | Capability | Users and access | Expected result |
|---|---|---|---|
| 1 | Manage activities | Users with the applicable activity permission | Record a name, mastered category, optional room, description, and optional financial details in one save. Manual creation records completed work and settles any income or expense. Follow-up statuses remain editable on existing records. |
| 2 | Record work without money | Same as requirement 1 | Cleaning can be scheduled and completed with no financial details. No zero-cost expense exists. |
| 3 | Record income or expenses | Same as requirement 1 | Record drafts with an unknown or positive amount, or settle a positive amount with its payment date. |
| 4 | View finances | Users with activity read permission | Income & Expenses shows only activities with financial details. Both menus open the same record. Totals use settled payments and the full filtered collection. |
| 5 | Schedule recurring work | Users with recurring-plan permissions | Define an interval and start date. The server generates due activities without duplicates. |

## 3. Data and business rules

### Activity

| Field | Meaning | Rules |
|---|---|---|
| ID | Activity identity | Generated and read-only. |
| Name | Activity name | Required; trimmed; bounded text. |
| Description | Additional details | Optional; bounded text. |
| Room | Related room | Optional existing room. Only the activity owns this link. Public records show a room name. |
| Tenant | Historical association | Optional tenant account reference. Preserved across room moves and deactivation. Changing a saved association requires an audited correction. |
| Work status | Work progress | Set to Completed for manual creation. Existing activities can be Planned, In progress, Completed, or Cancelled through follow-up. Create accepts no work-status input. |
| Expected date | Due date from a recurring plan | Stored as occurrenceDate. Read-only. For a non-financial activity, work is expected then. For an expense, payment is expected then. For income, receipt of money is expected then. Ad-hoc activities have no expected date. |
| Completion date | Work completion date | Set to today in Asia/Jakarta when work becomes Completed. Retained on unrelated edits, cleared on reopening, and refreshed on a later completion. Read-only. |
| Financial kind | Financial involvement | No financial details, Income, or Expense. |
| Category | Activity classification | Required master reference for every activity, independent of money. Defaults to General. Public records show its current master name. |
| Amount | Recorded amount | Unknown in a draft, or a positive whole number no greater than 2147483647. Zero is not a placeholder. |
| Payment status | Financial progress | Set to Settled for manual income or expense. Null without money. Existing financial activities can be Draft or Settled through follow-up. Create accepts no payment-status input. |
| Actual financial date | Date money moved | Labelled Date paid for expenses and Date received for income. Defaults to today in Asia/Jakarta when settled. Users can enter an earlier date. Retained on unrelated edits; absent for Draft. |
| Receipt | Proof of payment | Optional stored file, handled through the existing upload contract. |
| Recurring plan | Source plan | Set by the server for generated activities; read-only. |
| Created/updated actor and time | Audit values | Set by the system. |

No financial details requires amount, payment state, payment date, and receipt to be null. Category remains selected and stored. This is the absence of financial involvement, not an expense with amount zero.

Manual activities have no expected-date input. Scheduled activities receive their expected date from their source plan. The source occurrence and completion dates cannot be supplied through activity create or update commands.

Existing work and payment states remain independent during follow-up. Manual create has no status controls or status fields in its command. It records completed work, with settled money when financial details are present. Actual financial date defaults to today and stays editable. Completion date is recorded by the server. Recurring generation continues to create Planned work and Draft money.

Settled income and expense totals use recorded payments. Drafts are counted separately. Filters apply before aggregation. Payment date filters apply to payment dates; drafts without dates do not match a payment date range. Lists and totals do not infer payments from Room Type cost.

The Create form keeps Name, Category, Room, Tenant, and Description first. Financial details comes after these fields, followed only by its conditional amount, actual date, and receipt fields. Selecting a financial kind expands the bottom of the form without moving the preceding activity fields. Edit places follow-up status controls after those stable fields.

Small fixed-choice inputs use radio controls. Room lookups remain selects. Optional radio filters include All to clear the filter.

Records are edited through the shared Activity pages. Deletion of financial history is not included.

### Tenant attribution

Add nullable tenantId to an activity, referencing the existing tenant account.
This is the associated tenant, not the owner who entered the activity and not
a declaration of proven responsibility. Do not use createdBy for attribution.
One record supplies both histories and counts once in financial summaries.

For a new current event, suggest the room's current occupant, with an explicit
tenant choice or None. Preserve the selected tenant when the room assignment
changes. A historical or late-entered event needs the correct tenant selected
by the owner. Do not backfill existing events from today's occupant. Unknown
historical attribution stays unassigned and outside tenant-model inputs.

An explicit attribution correction records who changed it and why. It refreshes
both affected tenant results. Changes to an activity's amount or payment state
appear in both histories. Preserve earlier saved prediction inputs and the
attribution correction history.

Rent plans carry the intended tenant reference. Generated rent keeps that
reference even if generation is late. Moving a tenant closes or replaces the
relevant rent plan for future obligations. Existing unpaid rent stays with the
original tenant. Catch up due rent before retiring an old plan. Check the new
plan's start date to avoid missing or duplicate obligations. No-finance or
shared activities can remain unassigned.

Deactivation preserves the tenant's activity and prediction history. Restrict
hard deletion of an account referenced by these records. A tenant moving rooms
does not create a new assessment identity or restart evidence collection.

Attribution changes require Activity update permission and tenant read access.
The tenant selector includes existing historical tenant accounts, including
inactive accounts. Do not require that a historical tenant is today's occupant.
Normal creation can suggest the current occupant, but the owner confirms the
selection. A shared activity can remain unassigned.

Propose activity_tenant_attribution_changes with activityId, previousTenantId,
newTenantId, changedBy, changedAt, and reason. A change to saved attribution
requires a reason and writes its audit record in the same transaction. Initial
creation uses ordinary create audit. Later room assignment changes never
rewrite these references. Restrict hard deletion of referenced tenant accounts.

A rent plan's tenant can be set explicitly while it has no generated history.
After generation starts, replace the plan to change its tenant. Deactivation
preserves every generated payment. Do not reactivate a former tenant's rent
plan as the new tenant's plan. Existing unassigned activities remain unassigned
until the owner explicitly corrects them with an audit reason.

Tenant profiles show their authorized associated activity history across rooms.
Room history shows the same records with their historical tenant labels. These
views do not create another income/expense record. Current room assignment
continues to be owned by Rooms.

### Recurring plan

| Field | Meaning | Rules |
|---|---|---|
| ID | Plan identity | Generated; read-only. |
| Name and description | Activity template | Name required; description optional. |
| Room | Activity room template | Optional existing room. |
| Tenant | Historical tenant template | Optional tenant reference copied to new occurrences. Required for newly configured tenant rent plans. Existing generated rows are not reassigned when a plan changes. |
| Start date | First occurrence date | Required calendar date. |
| Interval count | Repeat interval | Positive integer up to 366. |
| Interval unit | Calendar unit | Day, Week, or Month. |
| Active | Generation enabled | Defaults to true. Turning it off preserves existing activities. |
| Category | Activity classification template | Required category reference, independent of money. Defaults to General and copies into each new activity. |
| Financial kind and amount | Optional financial template | No financial details by default. Financial templates generate Draft payments without a payment date or receipt. |
| Generation cursor | Next due occurrence | Server-owned. |
| Created/updated actor and time | Audit values | Set by the system. |

The server checks due plans at startup and periodically while the API runs. It uses calendar dates in Asia/Jakarta. The operation locks the plan, writes occurrences, and advances its cursor in one transaction. A bounded backlog continues on later runs. Repeated runs cannot duplicate a plan occurrence. Month intervals retain the original start-day anchor and clamp only when a month is shorter. After the first occurrence, the start date and interval cannot change. Deactivate the plan and create another plan to change its schedule. Reactivating a plan includes missed due dates.

## 4. User journeys and workflows

### Record a purchase

1. Open Income & Expenses and select Create.
2. Enter the activity name, expense category, and amount. Date paid defaults to today and can be changed for an older purchase. Add a room or receipt when needed.
3. Submit once. The activity and expense are one record.
4. Open that record from either list.

### Schedule and complete recurring work

1. For work with an explicit schedule, create a no-finance recurring plan with a room, optional tenant, start date, and owner-selected interval. Routine cleaning has no mandatory fixed interval.
2. The server creates a Planned activity when each occurrence is due.
3. Open the activity, set Completed, and submit. The server records its completion date automatically.
4. Cleaning remains absent from Income & Expenses.

### Follow up on an activity

1. Open an existing activity from either list.
2. Edit its work or payment state when follow-up is needed. Recurring activities start Planned, with Draft financial details when applicable.
3. Record the positive amount and actual date when a Draft payment is settled.
4. Work completion and payment settlement remain independently visible.

### Manage Activity Categories

1. Open Activity Categories to create, view, rename, or delete a category.
2. Categories have a generated ID, a required unique trimmed name up to 100 characters, and system audit fields.
3. Category choices are available to users who can read Activities or Recurring Plans, without granting category management access.
4. Existing activities show renamed category names. Referenced categories cannot be deleted. The default General category cannot be deleted because it is used by create defaults.
5. Repeat seeds preserve category renames. Migration preserves existing free-text category names and assigns General to unclassified records.
6. The boarding-house seed adds Corrective Repairs, Scheduled Servicing, Routine Cleaning, Extra Cleaning, and Room Rent. General remains the default. Conflicts on an ID or name leave the existing record unchanged. These categories do not create activities or recurring plans.

| Condition | Result | Next step |
|---|---|---|
| Invalid financial combination | Reject the write and preserve input. | Correct the fields and submit. |
| Access denied | Use existing access-denied behavior. | Return to an allowed page. |
| Empty collection | Show the standard empty state. | Create a record when allowed. |
| Read or write failure | Show the existing error feedback. | Retry without duplicating a completed write. |
| Inactive recurring plan | Generate no new occurrences. | Reactivate the plan when required. |
| API was stopped | Due work is generated after restart, in bounded batches. | Existing occurrence history remains intact. |
