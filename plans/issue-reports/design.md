# Issue reports

Design: Approved
Implementation: In progress

## 1. Purpose and scope

Occupants use their existing sign-in to report problems with room facilities.
The owner reviews reports and tracks the response in Issue Reports.

## 2. Functional requirements

| Capability | Access | Result |
|---|---|---|
| Submit a report | Occupant with a current room assignment | The report records the signed-in occupant, the selected room, and an Open status. |
| View a report | Reporter or owner | The reporter sees their own reports. The owner sees all reports. |
| Update a report | Owner | The owner can change the status and link an existing corrective repair Activity for the same room. |

## 3. Data and business rules

The report has a title, a description, a room, a reporter, and a status.
The status is Open, In progress, or Resolved. The room and reporter stay on
the report after a room assignment changes.

The server checks the room assignment during submission and limits occupant
reads to the signed-in reporter. A report link records the corrective repair
selected by the owner. The Activity must belong to the report room when the
owner links it. The occupant receives report data only. The owner must have
Activity view access to see Activity choices and links.

## 4. User journeys and workflows

1. The occupant opens Issue Reports and selects Create Issue Report.
2. The occupant selects an assigned room and enters the problem. The saved
   report opens with status Open.
3. The owner opens a report and selects Edit. The owner can update the status
   and can link a corrective repair if one already exists.
4. The occupant can open the report later to check its status.

## Delivery

The [capstone verification record](../../docs/capstone/verification.md) contains
the PostgreSQL 18 and browser results. Deployment and the owner trial remain
open.
