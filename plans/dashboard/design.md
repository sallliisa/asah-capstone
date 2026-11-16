# Operational dashboard

Design: Approved
Implementation: Needs update

The user approved financial period/room filters and tenant-grade presentation
during the capstone discussion. These additions are not implemented. Existing
dashboard delivery and browser evidence remain in [verification](verification.md).

## 1. Purpose and scope

Reuse the existing dashboard. Arrange operational work and settled cash in the user's 12-column by 12-row layout.

Included:

- The existing room map and its occupancy appearance.
- Needs attention, Upcoming plans, and cash panels.
- Four cash charts from recorded settled activity data.
- Shared period and room filters for financial totals and charts.
- Current-tenant grades on the map and a dashboard list of tenants ranked by owner-attention priority,
  with reasons. The detector uses its own rolling 12-month history.
- Read-only endpoint projections and direct links to existing records.

Excluded:

- Occupant reports, rent charges, arrears, forecasts, and account balances.
- New storage, manual dashboard configuration, and drag-and-drop layout.

The user directly specifies the layout and authorizes this dashboard change. The existing no-dashboard-header exception remains in force.

## 2. Functional requirements

| # | Panel | Desktop placement | Result |
|---|---|---|---|
| 1 | Rooms | Columns 1–6, rows 1–4 | Existing small room squares appear in the top-left card. |
| 2 | Needs attention | Columns 1–3, rows 5–12 | Open work and draft financial entries link to their activities. |
| 3 | Upcoming plans | Columns 4–6, rows 5–12 | The next seven days of scheduled plan occurrences link to their plans. |
| 4 | Cash | Columns 7–12, rows 1–12 | Settled income, expenses, and net cash appear with four charts, using the same period and room filters. |
| 5 | Financial filters | Within the financial section | Default to This month and All rooms. Offer Last month, Last three months, and a custom date range, plus a room selector. |
| 6 | Tenant priorities | Current-tenant grades on the map; a ranked list of unique tenants | Show A · Routine, B · Check soon, C · Check first, or Not enough data, with recorded reasons and the automatic history window labelled. A move does not reset the tenant grade. |

On small screens, cards stack in reading order. Page height can grow to keep content readable. Cards do not clip room squares or chart labels. Empty, loading, failed, and denied reads remain distinct.

## 3. Data and business rules

### Rooms

Keep current room loading, numeric room-code order, links, and 2.75rem squares with at most ten columns. Occupied rooms keep their background. Unoccupied rooms remain transparent.

Show the current tenant's grade without replacing the room's occupancy
indication or detail link. A vacant room has no current tenant grade. The same
tenant's grade can appear on several occupied rooms; list each tenant once in
the priority list. Previous tenant histories remain accessible from their
profiles. The financial period does not change grades. The
[tenant assessment design](../room-detector/design.md) defines attribution,
history, refresh, and explanation rules.

### Needs attention

An activity needs attention when its work is Planned or In progress, or when its financial state is Draft. Show the first eight, with a count of the full matching set.

Expected date means a work date only when there are no financial details. For financial activities it means the expected money date. Thus overdue work applies to unfinished non-financial work, and overdue money applies to Draft income or expenses. Open work on a paid financial activity must not become overdue solely from its expected money date. A cancelled work state does not settle a Draft financial entry.

Show overdue items first, then due dates and stable record identity. Ad-hoc follow-up can appear without an Expected date. Use readable names, work/payment labels, and labelled overdue feedback.

### Upcoming plans

Project active recurring plans from today through six days after today, inclusive. Use each plan's original recurrence anchor and its generation cursor. Exclude occurrences already generated. Project every occurrence in the window, rather than only one per plan. Return the first eight and the full matching count. Read operations create no activity or plan rows.

Future activity rows do not yet exist because the existing worker generates due occurrences. Upcoming plans therefore reads plans directly. Reuse the existing recurrence date calculation and avoid scanning a long backlog one date at a time.

### Cash and filters

Use calendar dates in Asia/Jakarta. Default to this month through today and All
rooms. Offer Last month, Last three months, and a custom date range. Display the
effective date bounds. Include Settled income and expenses by actual financial
date within the chosen period. Exclude Draft values, activities without money,
and future actual dates.

Apply the same selected period and room to financial totals and all four cash
charts. All rooms includes shared expenses. A selected room includes only
activities linked to that room; shared expenses are not allocated to it.
Preserve the existing dashboard structure. These controls belong to financial
analysis; they do not change the operational due lists or the detector's rolling
12-month history. Label that detector window separately.

Net cash is recorded income minus recorded expenses. It is not profit or an account balance.

The charts are daily income and expenses, cumulative net cash, expenses by Activity Category, and expenses by room. Shared expenses form a separate Shared room group. Daily series include zero for days with no settled payment. No sample data or forecast fills empty charts.

Aggregation uses the full matching set, not a list page. Names come from existing room and category masters. Charts have text summaries and a readable data alternative. Respect reduced motion and both app themes.

### DS analysis

Keep analysis with the existing dashboard workstream. Prepare notebooks for
pending activities, changes in settled income/expenses, and tenants needing
attention. Use the same synthetic source records and date meanings as the app.
Check reference totals separately. Findings and recommendations must identify
their supporting period and records. Do not invent current insights from
static example prose. Saved tenant predictions remain the model owner's data.

### Read contracts and access

The Activities dashboard endpoint must support the chosen financial period and
room and return effective date bounds, settled totals, daily series,
category/room groups, and an attention summary. Its current implementation is
fixed to this month and needs an update. Activities read permission remains
required.

The recurring-plan upcoming endpoint returns plan identity, readable labels, expected date, financial kind, and optional expected amount. It requires Recurring Plans read permission. Existing room read access remains unchanged. Do not load a denied panel's protected data.

Cache ownership follows Activities and Recurring Plans. Background refresh supports changes made by the recurring worker and stops when the dashboard unmounts.

## 4. User journeys and workflows

1. Open the existing dashboard.
2. Inspect occupancy in Rooms.
3. Open a Needs attention item to follow up on its Activity.
4. Open an upcoming occurrence to inspect its Recurring Plan.
5. Inspect cash using This month and All rooms, or change the period and room.
   Open the financial list with the same effective filters.
6. Review tenant priorities and open a tenant profile to inspect the grade,
   reasons, source rooms, and historical activities.

| Condition | Result | Next step |
|---|---|---|
| Panel is loading | Show its loading state. | Display the result after success. |
| No matching work or upcoming plan | Show a clear empty state. | Use existing record creation workflows when allowed. |
| No settled money | Show zero settled totals and chart empty states or zero daily series. | Record an actual financial activity. |
| A panel read fails | Show an error and Retry without inventing values. | Retry that read. |
| A user lacks permission | Show access feedback or omit protected data. | Other allowed panels remain usable. |
