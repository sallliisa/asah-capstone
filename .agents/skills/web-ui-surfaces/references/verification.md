# UI review

## Review the source

Compare changed pages with [DESIGN.md](../../../../DESIGN.md) and the approved
requirements. Check values, dependencies, access, navigation, and
[page placement](../../../../docs/architecture/web-application-architecture.md#route-ownership).
For custom UI, confirm the unsupported requirement recorded during
[owner selection](../../carta-module-development/SKILL.md#implement) still exists.

Trace one representative changed edit from loader through draft mapping,
submit, and completion. Trace a changed custom action through permission,
record policy, bound `can` and `run`, and invalidation. Resolve duplicate owners
of loading, forms, access, or refresh. Reuse evidence for unchanged paths.

Review custom submission against the
[write-outcome contract](../../../../docs/resource_system_overhaul/ARCHITECTURE.md#52-submission).

## Walk the changed interaction

For a changed layout, custom control, or workflow, walk one representative task
in the rendered app with data that exercises the change. Start from the user's
entry point. Confirm what appears first, that the intended action is easy to
find and operate, and that the outcome is clear. For a changed layout, check
the width where sections or controls change order or wrap. For an overlay or
editor, check dismissal or cancellation when it affects the task.

If a standard page serves a similar task, compare the result with that page.
Resolve issues that obscure the action, break the reading order, or make
recovery unclear. Record the task and observed result. If preview access
prevents the walkthrough, report which behavior remains unverified and why.

Apply [$verify-carta-module](../../verify-carta-module/SKILL.md) for additional
business proof. Routine field bindings use source review and normal checks.
For documentation-only changes, check source facts, links, and scope.
