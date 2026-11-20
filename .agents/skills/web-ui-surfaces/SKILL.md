---
name: web-ui-surfaces
description: Design, build, or review Carta web layouts, actions, forms, resources, and navigation.
---

# Web UI surfaces

Read [DESIGN.md](../../../DESIGN.md) for visual conventions.

## Decide the interaction

For a new or changed layout or interaction, identify the user's task, what they
need to see or do first, and what happens next. For a workflow, include where the
user starts, what context they need to keep, and where success or cancel leaves
them. Capture consequential choices in existing task notes. Routine field
bindings use the standard interaction.

Read the references for the decisions the change requires.

| Decision | Guidance |
|---|---|
| Group page content, use a card, or replace part of a View | [Page composition](../../../docs/ui/surfaces.md#page-composition) |
| Place an action, choose a button variant, or select an icon | [Actions and icons](../../../docs/ui/actions.md) |
| Choose an overlay, inline form, or page | [Overlays and return paths](../../../docs/ui/overlays.md) |
| Show status, empty results, failure, or recovery | [Status and feedback](../../../docs/ui/feedback.md) |
| Present records or filter a collection | [Collections](../../../docs/ui/collections.md) |
| Choose a form input or row editor | [Form controls](../../../docs/ui/forms.md#select-a-field-implementation) |

## Choose the framework owner

| Work | Contract |
|---|---|
| Resources, operations, values, slots | [Architecture and compiled examples](../../../docs/resource_system_overhaul/ARCHITECTURE.md) |
| Routes, navigation, parents, Back targets | [File routing](../../../docs/architecture/file-routing.md) |
| API schemas, transport, query ownership | [Web architecture](../../../docs/architecture/web-application-architecture.md) |
| Forms and inputs | [$build-resource-form](../build-resource-form/SKILL.md) |

Before selecting components for a changed interaction, use the
[capability index](references/capabilities.md) to find its existing owner. For
prototype-based work, read [prototype translation](references/prototype-translation.md).

Use the highest-level supported composition: standard View/action, extension
point, then lower-level components. Add local code for unmet requirements.
Use View-supplied guarded callbacks in custom controls; direct resource calls
bypass mounted protections.
Bound commands already invalidate their resource. Add invalidation only for
another affected resource or an unbound write.

Call `resource.list()` and `resource.create()` to bind their page props. Bind
`detail` and `update` with the record identity. Use [View slots](../../../docs/ui/surfaces.md#view-slots)
or `useRecord` for custom record pages. Use `useCollection` when a custom page
owns a collection presentation.

## Check the result

Normal web type checks and builds validate module navigation paths.
Use [UI review](references/verification.md) for changed web pages and controls.
