# Dashboard verification

Date: 2026-11-09

- Focused API route tests: passed, 3 tests. Covers settled cash date bounds, daily totals, grouping, independent work and payment follow-up, recurrence cursor and month anchors, and both permission gates.
- API type check and lint: passed by the API owner.
- SDK type check: passed.
- Web type check and focused dashboard lint: passed.
- Diff whitespace check: passed.
- Browser rendering: unverified. The UI inventory has no connected browser. Native Helium changed pages during inspection; further input stopped to avoid interference with the user.
- CSS source specifies 12 equal column and row tracks. Rooms spans 6 columns and 4 rows; attention and plans each span 3 columns and 8 rows below Rooms; cash spans 6 columns and 12 rows on the right. Narrow screens stack the cards.
- No application database migration or development data write was needed. Focused database tests used the guarded local carta_api_test database.

Local full check logs are in `.local/verification/dashboard/`.

## Viewport fit update, 2026-11-11

Removed the five-rem minimum row height. The dashboard uses the available shell height and zero-minimum grid tracks. Cash charts use two columns and two rows with flexible canvas heights. Cards use default filled surfaces. Long card content scrolls inside its card; the dashboard page does not scroll. Web type check and focused lint passed. Browser rendering remains unverified.

## Separate cash cards, 2026-11-11

Removed the outer cash card. Each cash total and chart has its own default filled card. Chart heights are bounded from 10 to 15 rem instead of growing to fill the panel. The chart data disclosure has a separate card. Occupied rooms use surface-container-high. Focused lint passed. Browser rendering remains unverified.

## Remove chart data section, 2026-11-11

Removed the visible chart data disclosure at the user’s request. Cash totals retain links to financial records. Removed the canvas fallback reference to the deleted section.

## Ranked room costs, 2026-11-11

Kept the room expense chart and added a separate card below the four charts for the three rooms with the highest settled expenses this month through today. Each total lists linked activities and their amounts. Shared expenses remain in cash totals and category charts but are excluded from the room ranking. The existing cash query supplies the activity details, so both use the same date and payment filters. API, SDK, and web type checks and scoped lint passed. Database route tests and browser rendering were not verified for this update.

## Mobile dashboard scrolling, 2026-11-11

The dashboard uses page scrolling below the desktop breakpoint. At 390 and 900 pixels in Chromium, the previous layout stopped scrolling with the final card out of view. The running dashboard now scrolls the full final card above the fixed navigation pill. The desktop check confirmed the viewport layout at 1440 pixels. Evidence is in `.local/verification/dashboard-pill-scroll/`.

## Financial filters and tenant results, 17 November 2026

Added This month, Last month, Last three months, custom dates, and an optional
room filter. All rooms includes shared expenses. The effective date bounds and
room travel with links to financial records. The API fills dates across month
boundaries and excludes future money dates. Its operational attention query is
independent of the financial filters. Saved tenant grades use their own window.

Four real API/database tests passed, including a distinguishing two-room/shared
expense case and custom/three-month periods. API, SDK, and web type checks,
focused API/web lint, formatting, and the production web build passed. Existing
large-chunk and plugin-time build warnings remain. No database migration was
needed. Authenticated browser acceptance for these additions remains unverified.

The Hono custom-route type does not declare query fields. A local dashboard
action supplies its validated financial query and parses the result. No shared
adapter or framework package was changed.

analysis/notebooks/operations-analysis.ipynb executed against the same synthetic
histories as the model. It covers pending work, settled cash changes, and saved
model priorities. A separate SQLite query matched the June cash totals. Findings
and recommendations include their period and source IDs in analysis/report.json.
No synthetic totals are presented as current app facts.

## Tenant and room review, 25 November 2026

The production web build ran against the populated local presentation API in
Chromium. Its 40 tenants included 4 in Check first, 8 in Check soon, and 28 in
Routine. The first screen showed the four highest-priority tenants, their rooms,
the assessment dates, and the recorded evidence.

- Selected Check soon and expanded the list. All eight matching tenants appeared.
- Opened a Check first tenant, then followed a repair record from the profile to Activity Details.
- Opened a flagged room from the map and reached Room Details.
- Switched between the four charts and opened the daily data table.
- Selected Last month and room 202. The settled-record link retained the room and the October date bounds. The tenant counts still covered the property.
- Checked the 390, 1024, and 1440 pixel layouts and the dark theme. The page fit the available width. The sample report link remained reachable at the bottom on mobile.

The web type check, production build, surface architecture check, and focused
lint and formatting checks passed. Lint issued one advisory for the native
grade filter buttons. They combine a grade, its count, and the pressed state
in one control. The build reported browser data and bundle size warnings.

The standard E2E preflight could not validate the disposable browser database
or storage bucket because `apps/api/.env.e2e` was absent. The browser
walkthrough used the local presentation records and signed in through the
normal application form. It used a separate production build and did not
require a database reset.

Screenshots, the walkthrough, and check logs are in
`.local/verification/dashboard-review-20261125/`.

## Operations before scrolling, 25 November 2026

Opened the dashboard in Chromium with the populated 40-room property. Checked
1366×768, 1024×768, 390×844, and 375×667 without scrolling. Each first screen
showed occupied and vacant counts, links to all 12 flagged rooms, tenant
reasons, the open-task count and due dates, and the upcoming schedule. Cash
started below the visible area on all four screens. The narrower layouts
showed two tenant reasons and two tasks. The wide desktop showed four of each.

Opened a room, a tenant profile, and an activity from the overview. Scrolled
to cash, switched chart views, and applied the previous month and room 202
using the inline controls. The expenses link opened Income & Expenses with
the correct room, date bounds, expense kind, and settled status.

The production web build, web type check, focused lint, formatting, surface
architecture check, and diff whitespace check passed. The build reported the
existing browser data and bundle size warnings. Screenshots and walkthrough
results are in `.local/verification/dashboard-compact-20261125/`.

## Space after the operational overview, 25 November 2026

At 1672×980, the previous dashboard left 362 pixels between the schedule and
cash. The revised layout showed all 12 flagged tenants and their reasons on the
left. It showed four overdue tasks and three upcoming activities on the right.
The cash section followed the overview by 16 pixels.

Chromium confirmed the same 16-pixel gap at 1366×768, 1024×768, 390×844, and
375×667. At all five sizes, the schedule fit before scrolling and the cash
totals were below the visible area. The cash controls start wherever the
operational records end.

The production web build, type check, focused lint, surface architecture
check, and whitespace check passed. Measurements and screenshots are in
`.local/verification/dashboard-spacing-20261125/`.

## Full room map and automatic cash filters, 25 November 2026

Opened the dashboard in Chromium against the 40-room property. At 1672×980,
1366×768, 390×844, and 375×667 the map showed each room once in room-code
order. All 40 tile grades matched the saved assessments. Tasks and the
schedule fit before scrolling at all four sizes. Cash totals followed the
first view. The desktop date and room controls shared a row across the section.
On phones the dates shared one row and the room selector used the next row.

Opened room 202 from its tile. Changed the start date, end date, and room
independently. Each change updated the link to the settled transactions.
For room 202 in October, the displayed income, expenses, and net cash matched
the dashboard API. Clearing the room restored all rooms. A reversed range
hid the amounts and showed a date error. Correcting the range restored them.
Opened the expenses link and checked the date, room, kind, and payment status.

Focused lint reported two native-control review warnings for the date inputs.
The fields use Loom labels and browser date bounds. Formatting, web type checking,
the production build, the surface architecture check, and the Impeccable detector passed.
Measurements, screenshots, and check output are in
`.local/verification/dashboard-room-map-dates/`.

## Compact room map and Loom date inputs, 25 November 2026

Chromium showed 40 number-only room tiles. The map measured 400×140 pixels
at 1672×980. The counts showed 40 occupied, 0 vacant, 4 Check first, 8 Check soon,
and 28 Routine. The schedule fit before scrolling at desktop, laptop, and
two phone sizes. Cash followed the operations sections in normal page flow.

Opened room 202 on the dashboard. Its popover showed the occupant and grade.
Escape closed it and returned focus to the tile. Enter opened it again, and
Room details opened the room record. In a browser timezone west of UTC,
the cash dates matched the selected calendar days. Calendar selection and
typed dates updated transaction links automatically. Invalid dates blocked
the amounts until corrected.

The production build, Vue type check, focused lint, and whitespace check
passed. Evidence is in `.local/verification/dashboard-compact-popover/`.

## Occupancy legend and independently scrolling lists, 25 November 2026

At 1672×980 and 1366×768, the task and schedule cards both measured 230
pixels high with the current data. At 390×844 and 375×667, the title, room
map, task list, and schedule fit before page scrolling.

The 40-room property showed 100% occupancy and 12 rooms graded B or C.
Selecting Check first kept four tiles in color. Selecting Check soon kept
eight. Selecting Check soon again restored all colors. The room positions
and popover links remained usable.

Task and activity scrolling used the populated development property.
There were no upcoming recurring plans, so a browser-only layout fixture
exercised the plan list overflow. Scrolling each list left its neighbor
and the card in place.

The production build, type check, formatting, and whitespace check passed.
Focused lint reported one native-control review warning for the legend
toggle. The native button exposes the pressed state for its visible label.
Evidence is in `.local/verification/dashboard-legend-scroll/`.

## Tenant follow-up, 25 November 2026

The desktop preview selected the first eligible tenant in the saved priority
order and linked to the correct tenant profile. In the populated property,
it showed room 402 and six recorded repairs in 90 days. The assessment date
matched the saved result. The same observation appeared in the room popover
on a phone.

The 40 tiles remained visible when the legend highlighted grade C. The
schedule fit before page scrolling at 1672×980, 1366×768, 390×844, and 375×667.
The production build, web type check, formatting, and whitespace check
passed. Focused lint reported the existing native legend button warning.
Evidence is in `.local/verification/dashboard-room-signals/`.

## Follow-up groups in the room map, 25 November 2026

The populated property showed 2 tenants with overdue rent, 11 with rent paid
late, and 6 with at least two repairs in 90 days. Selecting each group
highlighted the expected room codes. The grade legend replaced the group
selection and restored all 40 tiles on deselection. After a narrow resize,
the clear control restored the map. Room 402 still opened its saved
observations.

The map, legend, and follow-up panel shared the same top edge at 1672×980 and
1366×768. The schedule fit before page scrolling at both sizes and at
390×844 and 375×667. Build, type check, formatting, and whitespace checks passed.
Focused lint reported review warnings for the two native map toggles.
Screenshots and measurements are in `.local/verification/dashboard-follow-up/`.

## Six follow-up categories, 25 November 2026

Chromium showed six categories in two rows at 1672×980 and 1366×768.
Five tenants had an average late rent payment of at least seven days.
Four had one repair in 90 days. Both filters highlighted the expected
room codes. Extra cleaning showed zero tenants and its control was
disabled. The grade legend and room popovers worked after switching filters.

The schedule fit before page scrolling at both desktop sizes and at
390×844 and 375×667. Build, Vue type checking, formatting, and whitespace
checks passed. Focused lint reported the existing map-toggle warnings.
Evidence is in `.local/verification/dashboard-six-follow-ups/`.
