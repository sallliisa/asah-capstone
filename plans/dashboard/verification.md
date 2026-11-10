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
