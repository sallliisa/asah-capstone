# Carta UI conventions

- **Status:** Authoritative
- **Scope:** `apps/web` and UI surfaces from `packages/loom`

Read [DESIGN.md](../../DESIGN.md) for app layout, component reuse, display values,
and interface text. The references below define technical composition.
Module contracts own domain behavior; public component APIs own technical
requirements. Framework package changes need explicit scope.

## Select the applicable branch

- [Page composition](surfaces.md) for sections, cards, and View slots.
- [Actions and icons](actions.md) for placement, emphasis, and visible labels.
- [Overlays and return paths](overlays.md) for menus, popovers, dialogs, and
  the decision to use an inline form or a page.
- [Status and feedback](feedback.md) for status, results, failure, and recovery.
- [Collections](collections.md) for record presentation and collection filters.
- [Forms](forms.md) for fields, drafts, row editors, submission, and assets.

Read only the branches used by the changed surface.
