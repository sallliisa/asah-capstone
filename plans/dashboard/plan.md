# Dashboard delivery

## Work steps

1. Ground the current dashboard, activity states, recurrence cursor, and cash reads.
2. Define the fixed panel layout and read-only endpoint shapes.
3. Implement API reads and web panels in separate file sets.
4. Verify real route data rules, application types, lint, and rendered behavior where tooling permits.

## Throughput checkpoint

- Blocking first steps. Preserve the room map and agree the two read response schemas before web consumption.
- Independent workstreams. One API owner writes the two read projections and focused database tests. One web owner writes the 12x12 layout, data readers, and chart lifecycle.
- Shared mutable state. API schema and route files have one writer. Dashboard web files have one writer. The parent alone runs database proof. Existing manifest and router changes from other work are not part of this task.
- Smallest safe decomposition. Reuse the existing Activity and Recurring Plan responsibilities. Add no new persistence or dashboard resource store.

## Selected proof

- Real API/database tests distinguish settled, Draft, old-month, future, and nonfinancial records; verify daily/group totals and independent overdue rules.
- Upcoming tests distinguish active and paused plans, repeated occurrences in seven days, cursor exclusions, and calendar-month anchors.
- Normal API, SDK, and web type checks and focused lint cover the transport and component contracts.
- Browser proof targets exact desktop grid placement, narrow-screen stacking, chart visibility and accessibility, and actionable links. Report a tool blocker if this boundary cannot be driven.
- No database migration is required.

## Current status

Implementation and automated checks are complete. Browser rendering remains unverified because no browser connector is available and native browser navigation could not be controlled safely. Existing user work in manifest and router files remains outside the task. See [verification](verification.md).
