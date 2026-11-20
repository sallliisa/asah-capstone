# Overlays and return paths

## Choose an overlay

| User task | Component |
|---|---|
| Read a short supplementary hint | `Tooltip`. Keep labels, required instructions, and recovery steps visible. |
| Pick from a short set of related commands | `Menu` with a visible trigger. Use `ContextMenu` as a shortcut when the same important commands have a visible path. |
| Change a small setting or filter while keeping the page in view | `Popover` anchored to its control. |
| Confirm a consequence or complete a focused task | `Dialog`. Use `DialogForm` for a short edit tied to the open record. |
| Edit fields together with the surrounding content | Embed `Form` in that content. |
| Complete an independent task or return to it by URL | Use a page. Use `FormView` for an independent record editor. |

[ListView](../../packages/loom/src/components/views/ListView.vue) uses a popover
for filters, a menu for export commands, and a dialog for delete confirmation.

## Define completion and dismissal

Confirm destructive actions. State which record or setting the action affects.
Describe the consequence and name the command on the confirmation button.

Choose the destination after success and after cancellation. For a contextual
edit, return to the invoking content with its record and list context in place.
For a page editor, check the header Back control, Cancel, and successful
completion from the entry paths the task changes.

Keep the draft available when validation or a write fails. If dismissal would
discard consequential work, use the form's dismissal contract. Check the initial
focus, keyboard dismissal, and focus return for the chosen overlay. See
[dialog forms](forms.md#dialog-forms) and [file routing](../architecture/file-routing.md).
