# Rooms and dashboard

Design: Approved
Implementation: In progress

## 1. Purpose and scope

Store boarding house rooms as master data. Show those rooms in a Rooms card at the top left of the existing dashboard, with the square grid centered inside the card.

Included:

- Room list, detail, create, edit, and delete pages.
- A dashboard room map with at most 10 columns.
- Room access through the existing permission system.
- Occupant role and optional room assignments to user accounts.
- Room Types master data with name and cost.

Excluded:

- Bookings, payments, tenant billing, and multiple boarding houses.
- Geographic maps, floor plans, and drag-and-drop placement.

## 2. Functional requirements

| # | Capability | Users and access | Expected result |
|---|---|---|---|
| 1 | Manage room master data | Users with the applicable room read, create, update, or delete permission | Standard pages store and display rooms. Navigation includes Rooms. |
| 2 | View the room map | Users with room read permission | Dashboard shows one labelled square per saved room, ordered by room code. |
| 4 | Assign occupants | Users with room create or update permission | Select a user with an active Occupant role assignment, or clear the room assignment. |
| 5 | Manage room types | Users with the applicable Room Types permission | Create, read, edit, and delete types; referenced types cannot be deleted. |
| 3 | Wrap the map | Same as requirement 2 | The grid is centered inside the Rooms card. The card occupies the top-left dashboard cell. Each row has at most 10 squares. Smaller screens use fewer columns. All cells remain square. |

## 3. Data and business rules

### Room

A room is one rentable unit in the boarding house.

| Field | Meaning | Rules |
|---|---|---|
| ID | Record identity | Generated; cannot be edited. |
| Room code | Label on the room map | Required; trimmed; unique; maximum 30 characters. |
| Occupant ID | Assigned user | Optional user reference; writes must select a user with an active Occupant role and active role assignment. Clearing it makes the room unoccupied. One user can occupy more than one room. |
| Room Type ID | Assigned room type | Required stored reference; defaults to Standard. Existing rooms are assigned Standard by migration. |
| Name | Room name | Required; trimmed; maximum 100 characters. |
| Description | Additional room information | Optional; maximum 1000 characters. |
| Created at | Creation time | Set by the system; read-only. |
| Updated at | Last change time | Set by the system; read-only. |
| Created by | User who created the room | Set by the system; read-only. |
| Updated by | User who last changed the room | Set by the system; read-only. |

Room codes are case-sensitive. Occupancy is derived from the presence of Occupant ID. Occupied squares keep the existing surface background. Unoccupied squares have a transparent background, including on hover. A square shows its room code and links to room detail. The dashboard shows the room map in a shared Rooms card at the top left, without a page header. The operational panels and 12 by 12 desktop grid are defined in [the dashboard design](../dashboard/design.md). Small screens stack the cards. This is an explicit user exception to DESIGN.md page-header rules. Room squares are 2.75rem wide, with a 0.5rem gap; narrow containers can reduce the square width. Long room codes are truncated visually; each link retains the full accessible label.

### Room Type

| Field | Meaning | Rules |
|---|---|---|
| ID | Record identity | Generated; read-only. Standard uses the stable ID room-type-standard. |
| Name | Type name | Required; trimmed; maximum 100 characters. |
| Cost | Cost for this type | Required whole number from 0 to 2147483647. No billing frequency is added. |
| Created at / Updated at | Audit time | Set by the system. |
| Created by / Updated by | Audit user | Set by the system; optional for seed records. |

Seed Standard with cost 1500000. Seed the Occupant role with code occupant and no management permissions. Repeat seeds preserve edits and existing room assignments. The migration assigns all existing rooms to Standard once. Deleting a referenced type is rejected. User deletion clears the room's occupant reference. Changing a user's roles does not automatically clear an existing assignment.

The user authorized direct implementation of this extension without a separate design approval step.

## 4. User journeys and workflows

### Manage rooms

1. Open Rooms to see saved records.
2. Use Create to enter a room code, name, and optional description.
3. Select a Room Type and optional Occupant. Submit the form. After a successful write, open the saved room.
4. Use the standard Edit or Delete action when needed. Delete requires confirmation that names the room.

### View the dashboard

1. Open Dashboard.
2. Load all saved rooms and show the centered grid.
3. Select a square to open its room detail.

| Trigger or condition | Result | Next step |
|---|---|---|
| There are no rooms | Show an empty-state message and a Create link when allowed. | Create a room. |
| Room data is loading | Show a loading state. | Show the map when the read succeeds. |
| A read fails | Show an error with Retry. | Repeat the read. |
| A room code already exists | Reject the write and retain form input. | Enter a different code and submit. |
| Input is invalid or a write fails | Show the error and retain form input. | Correct input or retry. |
| Access is denied | Use the existing access-denied behavior. | Return to an allowed page. |
| A room is saved or deleted | Refresh the related room data. | The next dashboard view reflects the saved data. |
