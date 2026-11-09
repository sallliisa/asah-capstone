# Room delivery

The design is approved.

Selected proof:

- Standard CRUD surfaces: API, SDK, and web type checks; app lint; source review of resource, route, and navigation configuration.
- Room persistence and access: real route/database tests for normalized writes, duplicate room codes, audit values, edit/delete persistence, and route permission denial. These assertions detect missing schema or guard wiring. Shared framework tests do not establish this module wiring.
- Dashboard: browser proof for square layout, centering, wrapping after 10 rooms, detail navigation, and narrow screens. Standard form interaction uses existing framework proof.

No framework packages are changed. Development migration history was read before writes; both existing migration records match the local sequence. The new migration adds only rooms and its audit foreign keys.

## Results

- Development migration applied successfully. The rooms table and audit foreign keys are installed in the configured Neon development database.
- Room permissions were seeded through the existing authorization seed. No sample room records were added to development.
- `pnpm --filter @southneuhof/api test:focused -- 'src/routes/(authenticated)/rooms/rooms.routes.spec.ts'`: 2 tests passed against the separate local test database. Earlier runs failed because PostgreSQL was stopped, the migration configuration selected the development URL, and the denial test supplied a GET body. These issues were corrected before the passing run.
- API, SDK, and web type checks passed. Web checks first found a collection source error and a resource inference limit. The source now selects either data or a loader. The create operation binds submission after form construction to avoid the inference limit. No framework code changed.
- API lint passed. Web lint and formatting passed with existing warnings in unrelated files. The new dashboard uses an imported RouterLink and the shared Button control.
- `git diff --check` passed.
- Source review confirmed room fields, routes, access, navigation, square dimensions, the 10-column width limit, and room-data cache ownership.

## Remaining proof

Browser layout and navigation proof is unverified. No browser connector was available. Native Helium inspection worked, but attempts to open the preview through native controls timed out. The existing preview process was preserved. A separate `pnpm dev` launch failed because its web port 5181 was already in use. No existing process was stopped.

Implementation code and development setup are complete. Design implementation status remains In progress because the selected browser proof is incomplete. Evidence logs are in `.local/verification/rooms/`.

## Room assignments and types extension

Direct implementation is authorized by the user. Selected proof: route/database tests for role-filtered occupant choices, assignment validation and clearing, type cost validation, referenced-type deletion, and seed repeat safety. Standard master-data pages use type checks, lint, and configuration review. Dashboard colors are reviewed in source; browser rendering still needs live proof.

Extension results:

- Migration `20261109114007_room-types-and-occupants` applied to development after its existing migration history was checked. A fresh read confirms one active Occupant role, Standard at 1500000, and all 40 existing rooms assigned to Standard.
- The existing seed now includes boarding-house defaults. Repeated seeds use stable identities and preserve existing values and assignments.
- Room create/edit forms include Room Type and a clearable Occupant selector. Choice endpoints require room read access and expose only IDs and names. Room details and lists show related names. Occupant writes validate active role membership. Room Type writes validate the referenced record. Related room labels load in one request-scoped batch.
- The dashboard retains its small centered grid and numeric room ordering. Occupied room links retain the existing surface colors. Unoccupied links have a transparent background and no hover background.
- Focused API suite: 5 tests passed in 2 files. Coverage includes persisted assignments, clearing, role-filtered choices, denied access, type costs, invalid references, deletion protection, and repeat seeds that retain a custom room type assignment.
- API, SDK, and web type checks passed. API lint passed. Web lint and formatting passed with 14 existing warnings and no errors. `git diff --check` passed.
- Initial extension checks found test status expectations that differed from the framework's 400 validation response and an unsupported cost display configuration. Tests now use the actual validation contract; cost uses the existing number formatter.
- Browser rendering and selector interaction remain unverified. No browser session or native controls are available for reliable automation in this session. No framework package was changed.

## Dashboard card

The user requests reuse of the dashboard with the existing map in a top-left card. The dashboard route now uses the shared outlined Card and a responsive one/two-column grid. The map stays centered inside the card. Its data loading, numeric ordering, room links, small squares, occupancy colors, access checks, and feedback states are unchanged. No other dashboard panels were implemented.

Scoped lint, formatting, normal web type check, and git diff --check passed. No new test was added for this reversible layout change. Browser rendering remains unverified under the existing connector limitation.
