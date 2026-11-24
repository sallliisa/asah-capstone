# Capstone verification record

## Local verification on 24 November 2026

The checks used sample records, PostgreSQL 18, and an isolated MinIO bucket.

| Check | Observed result |
| --- | --- |
| Room deletion | PostgreSQL 18 returns HTTP 409 when a saved record protects the room. |
| Settings access | The Users, Roles, and Permissions menus use the same list grants as their API routes. The detail routes use the detail grants. |
| Tenant filter | A caller with Activity read access can filter Activities and settled financial totals by tenant. The tenant directory still requires its own permission. |
| Issue report access | Each occupant can submit for an assigned room and read their own report history. The API denies reports from other occupants, owner updates, and Activity data to the occupant. |
| Owner follow-up | The owner can update a report and link a corrective repair for its room. The API rejects an unrelated repair. |
| Report pages | A signed-in occupant landed on Issue Reports and saw their report. The owner edited the status in the web form. A new occupant request confirmed the saved status. |
| Dashboard | Chromium displayed the live chart data table and the labeled synthetic report at desktop, tablet, and phone viewport widths. |
| Receipt storage | The API saved a receipt on a settled Activity. A later read returned the same asset ID. The downloaded bytes matched the upload. |
| Interactive API reference | Anonymous access returns HTTP 401. A signed-in owner opened Swagger UI and ran the Rooms list operation successfully. |

The API, SDK, and web type checks passed. The web production build passed with
warnings for the browser data age and large chunks. Seven navigation manifest
tests passed. These checks used the combined local code.

## Owner trial

Use an account and records for the trial. Record the device, browser, date, and result for each task. Keep account details and session information out of screenshots and recordings.

1. Assign a tenant to a sample room. Compare its status with the dashboard.
2. Set up monthly rent and four-month air-conditioner service. Follow a due reminder to the activity.
3. Settle a sample payment and attach a receipt. Compare the payment with the cash total for its date and room.
4. Submit a room issue as the occupant. Review and resolve the issue as the owner. Read the changed status as the occupant.
5. Ask the owner to describe any step they could not complete without help. Record the result and the proposed correction.

The owner trial, physical-device checks for this build, and deployment acceptance
remain open. Apply the issue-report migration and authorization seed on the
release database before checking report access there.
