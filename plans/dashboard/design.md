# Operational dashboard

Design: Approved
Implementation: Current

On entry, the owner can see which rooms or tenants need attention, which tasks are open, and what is scheduled next.

## Room occupancy

Show every room once in room-code order. Show only the room code and status color on each tile. Group the occupied and vacant counts with the status legend beside the map. Selecting a status removes color from the other tiles. Selecting it again restores the map. On wide screens, show the number of current tenants graded B or C whose saved assessments contain overdue rent, rent paid late, rent paid an average of seven or more days late, one repair in 90 days, two or more repairs in 90 days, or extra cleaning in 90 days. A group with zero tenants stays visible and does not filter the map. A tenant can appear in more than one group. Selecting a group highlights its tenants’ current rooms and clears the grade selection. Selecting the group again restores the map. Open a Loom popover from the tile to show the occupant, status, and permitted room detail link. Include dated observations for tenants graded B or C. Include the room status in the accessible button name.

A tenant can occupy more than one room. Use room identity for room counts. A vacant room has no tenant grade. Distinguish an unavailable assessment from a routine grade. The [tenant assessment design](../room-detector/design.md) defines the grades and their rolling history.

## Open tasks

Use the Activities projection for the total count and the earliest open tasks. Show the room and due date when available. Distinguish overdue work from the next scheduled activity. Read upcoming recurring occurrences from the plan projection. Link to the source activity or plan. Align the task and schedule cards when they share a row. Limit the height of each list so open tasks, activities, and recurring plans scroll separately under fixed headings. The [Activities design](../activities/design.md) defines task status and due dates.

## Settled cash

The owner can review income, expenses, and net cash movement below the schedule. Default to this month through today in Asia/Jakarta, across all rooms. Place Start date, End date, and Room in one row when space permits. Each valid change updates the cash analysis and its links to Income & Expenses. Use Loom DateInput for calendar dates and the existing room selector for the room lookup. Check range limits before loading cash. Show a validation message for an incomplete or invalid range. Use settled payments and their actual payment dates. Net cash movement equals income minus expenses. The owner can switch between daily cash, cumulative net cash, expenses by category, and expenses by room.

## Layout and access

Keep the room map, open tasks, and upcoming schedule together on entry. The map carries the assessment status. Place cash directly after operations with the normal section gap.

Read each collection with its existing permissions. Keep loading, empty, and failed reads distinct. Offer Retry beside a failed read. Refresh permitted records while the dashboard is open. Stop the refresh when the owner leaves.
