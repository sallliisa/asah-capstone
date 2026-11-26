# Activities and recurring plans

Design: Approved
Implementation: In progress

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
- One-off scheduling and recurring tasks with a configurable opening date.
- Dashboard To-do and Upcoming views of scheduled Activities.
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
| 5 | Schedule recurring work | Users with recurring-plan permissions | Set the first due date, interval, and number of days to open each task before it is due. |
| 6 | Schedule once | Users with activity create permission | Create a Planned Activity with a due date. Financial tasks start Draft. |
| 7 | Follow up on tasks | Users with activity read and update permissions | See open tasks in To-do and future deadlines in Upcoming. Record payment, complete work, cancel, or edit the deadline on the Activity. |

## 3. Data and business rules

### Activity

| Field | Meaning | Rules |
|---|---|---|
| ID | Activity identity | Generated and read-only. |
| Name | Activity name | Required; trimmed; bounded text. |
| Description | Additional details | Optional; bounded text. |
| Room | Related room | Optional existing room. Only the activity owns this link. Public records show a room name. |
| Tenant | Historical association | Optional tenant account reference. Preserved across room moves and deactivation. Edit Activity records any change to the saved tenant. |
| Work status | Work progress | Set to Completed for manual creation. Existing activities can be Planned, In progress, Completed, or Cancelled through follow-up. Create accepts no work-status input. |
| Due date | Task deadline | Editable on a scheduled Activity. A task is overdue after this date in Asia/Jakarta. |
| Occurrence date | Original date on a recurring plan | The server retains this date and plan ID to identify the occurrence when its due date changes. |
| Close task when | Completion rule | Work tasks close on work completion. Payment tasks close when the payment is recorded. Cancelling the Activity closes either type. |
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

Create Activity records past work. Schedule once accepts a due date and opens the task immediately. A recurring task starts with its occurrence date as the due date. Editing the due date keeps the same Activity, recurring identity, and notification.

Repairs, servicing, and cleaning are work tasks by default. Other financial tasks close when payment is recorded unless the user selects work completion. Paying for a repair leaves the repair task open until work is complete. Cancelling a task preserves its recorded payment. Reading its notification leaves the task open.

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

An attribution correction records who changed it and any note they supply. It refreshes
both affected tenant results. Changes to an activity's amount or payment state
appear in both histories. Preserve earlier saved prediction inputs and the
attribution correction history.

Rent plans carry the intended tenant reference. Generated rent keeps that
reference even if generation is late. Edit the relevant rent plan when a tenant
moves. The edit generates any old occurrences already due before it applies
the new tenant. Existing unpaid rent stays with the original tenant. No-finance
or shared activities can remain unassigned.

Deactivation preserves the tenant's activity and prediction history. Restrict
hard deletion of an account referenced by these records. A tenant moving rooms
does not create a new assessment identity or restart evidence collection.

Attribution changes require Activity update permission and tenant read access.
The tenant selector includes existing historical tenant accounts, including
inactive accounts. Do not require that a historical tenant is today's occupant.
Normal creation can suggest the current occupant, but the owner confirms the
selection. A shared activity can remain unassigned.

Activity tenant changes write activityId, previousTenantId, newTenantId,
changedBy, changedAt, and an optional reason in the same transaction. Initial
creation uses ordinary create audit. Later room assignment changes never
rewrite these references. Restrict hard deletion of referenced tenant accounts.

Edit a rent plan's tenant or schedule for future occurrences. An edited start
date starts the revised schedule. It replaces the ungenerated old schedule after
today, including any dates before the new start. A tenant-only edit keeps the
next upcoming date on an active plan. Deactivation preserves every generated
payment. Existing unassigned activities stay unassigned until an owner edits them.

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
| Open task days before due | Lead time for each occurrence | An integer from 0 to 366. Existing plans start at 0. The new-plan form starts at 7. |
| Active | Generation enabled | Defaults to true. Turning it off preserves existing activities. |
| Category | Activity classification template | Required category reference, independent of money. Defaults to General and copies into each new activity. |
| Financial kind and amount | Optional financial template | No financial details by default. Financial templates generate Draft payments without a payment date or receipt. |
| Generation cursor | Next occurrence to generate | Server-owned. |
| Created/updated actor and time | Audit values | Set by the system. |

The recurring job checks opening dates in Asia/Jakarta. It subtracts the lead time from each due date. The operation locks the plan, writes occurrences and notifications, and advances its cursor in one transaction. The job processes a bounded backlog on each run. The plan ID and original occurrence date identify one occurrence. Month intervals retain the original start-day anchor and clamp in shorter months. Changes to the recurring schedule preserve tasks already opened.

## 4. User journeys and workflows

### Record a purchase

1. Open Income & Expenses and select Create.
2. Enter the activity name, expense category, and amount. Date paid defaults to today and can be changed for an older purchase. Add a room or receipt when needed.
3. Submit once. The activity and expense are one record.
4. Open that record from either list.

### Schedule and complete recurring work

1. Create a recurring plan with the first due date, interval, and lead time. For example, open rent seven days before its due date and tax thirty days before its due date.
2. The server creates a Planned Activity when the task opens. It retains the due date and queues one notification.
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
