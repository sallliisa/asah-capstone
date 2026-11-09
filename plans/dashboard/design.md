# Operational dashboard

Design: Approved
Implementation: Complete; browser rendering unverified

## 1. Purpose and scope

Reuse the existing dashboard. Arrange operational work and settled cash in the user's 12-column by 12-row layout.

Included:

- The existing room map and its occupancy appearance.
- Needs attention, Upcoming plans, and This month's cash panels.
- Four cash charts from recorded settled activity data.
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
| 4 | This month's cash | Columns 7–12, rows 1–12 | Settled income, expenses, and net cash appear with four charts. |

On small screens, cards stack in reading order. Page height can grow to keep content readable. Cards do not clip room squares or chart labels. Empty, loading, failed, and denied reads remain distinct.

## 3. Data and business rules

### Rooms

Keep current room loading, numeric room-code order, links, and 2.75rem squares with at most ten columns. Occupied rooms keep their background. Unoccupied rooms remain transparent.

### Needs attention

An activity needs attention when its work is Planned or In progress, or when its financial state is Draft. Show the first eight, with a count of the full matching set.

Expected date means a work date only when there are no financial details. For financial activities it means the expected money date. Thus overdue work applies to unfinished non-financial work, and overdue money applies to Draft income or expenses. Open work on a paid financial activity must not become overdue solely from its expected money date. A cancelled work state does not settle a Draft financial entry.

Show overdue items first, then due dates and stable record identity. Ad-hoc follow-up can appear without an Expected date. Use readable names, work/payment labels, and labelled overdue feedback.

### Upcoming plans

Project active recurring plans from today through six days after today, inclusive. Use each plan's original recurrence anchor and its generation cursor. Exclude occurrences already generated. Project every occurrence in the window, rather than only one per plan. Return the first eight and the full matching count. Read operations create no activity or plan rows.

Future activity rows do not yet exist because the existing worker generates due occurrences. Upcoming plans therefore reads plans directly. Reuse the existing recurrence date calculation and avoid scanning a long backlog one date at a time.

### This month's cash

Use calendar dates in Asia/Jakarta. Include Settled income and expenses with an actual financial date from the first day of this month through today. Exclude Draft values, activities without money, previous months, and future actual dates.

Net cash is recorded income minus recorded expenses. It is not profit or an account balance.

The charts are daily income and expenses, cumulative net cash, expenses by Activity Category, and expenses by room. Shared expenses form a separate Shared room group. Daily series include zero for days with no settled payment. No sample data or forecast fills empty charts.

Aggregation uses the full matching set, not a list page. Names come from existing room and category masters. Charts have text summaries and a readable data alternative. Respect reduced motion and both app themes.

### Read contracts and access

The Activities dashboard endpoint returns the current date, month bounds, settled totals, daily series, category/room groups, and an attention summary. It requires Activities read permission.

The recurring-plan upcoming endpoint returns plan identity, readable labels, expected date, financial kind, and optional expected amount. It requires Recurring Plans read permission. Existing room read access remains unchanged. Do not load a denied panel's protected data.

Cache ownership follows Activities and Recurring Plans. Background refresh supports changes made by the recurring worker and stops when the dashboard unmounts.

## 4. User journeys and workflows

1. Open the existing dashboard.
2. Inspect occupancy in Rooms.
3. Open a Needs attention item to follow up on its Activity.
4. Open an upcoming occurrence to inspect its Recurring Plan.
5. Inspect month-to-date money and open the financial list through correctly namespaced date filters.

| Condition | Result | Next step |
|---|---|---|
| Panel is loading | Show its loading state. | Display the result after success. |
| No matching work or upcoming plan | Show a clear empty state. | Use existing record creation workflows when allowed. |
| No settled money | Show zero settled totals and chart empty states or zero daily series. | Record an actual financial activity. |
| A panel read fails | Show an error and Retry without inventing values. | Retry that read. |
| A user lacks permission | Show access feedback or omit protected data. | Other allowed panels remain usable. |
