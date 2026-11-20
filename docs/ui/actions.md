# Actions and icons

Choose the action's scope and importance before you choose a slot or a button
variant.

## Place the action

| Scope | Placement |
|---|---|
| Create one resource record | Keep the default `ListView` Create action. Use `#create-action` to replace that action when the workflow requires a different control. |
| Act on a collection | Use `ListView #resource-action` for commands such as Import or Mark all as read. The slot is available on lists without a Create route. |
| Change the visible results | Use the [filter placement rules](collections.md#filter-placement). |
| Act on one list row | Keep the standard View, Edit, and Delete controls. Use the named `#row-actions-view`, `#row-actions-edit`, or `#row-actions-delete` slot to replace that action. Use `#row-actions` to add a command. |
| Act on the open record | Use `DetailView #controls`. If the action belongs to a related section, keep it with that section. |
| Complete or cancel an edit | Use the form's action area. Preserve its submit and pending behavior when you replace the controls. |

Use a link to open a destination and a button to run a command. Keep the main
action and frequent actions visible. Use a [menu](overlays.md#choose-an-overlay)
for less frequent related commands. Use a split button when one command is the
clear default and alternatives belong to that same task.

See [ListView's header and row controls](../../packages/loom/src/components/views/ListView.vue)
for rendered slot order and accessible row actions.

## Choose emphasis and an icon

| Action | `Button` variant |
|---|---|
| Main action in the current task area | `filled`. Use strong emphasis for the action the user is most likely to take. |
| Supporting action that needs to be visible | `tonal`. Use `outlined` when the action needs a visible boundary with less emphasis. |
| Quiet action with clear context | `text`. Use it for actions such as Cancel beside Submit. |
| Familiar compact utility with an icon only | `kind="icon"` with `variant="standard"` for low emphasis. Give the control an accessible name. |

Use emphasis to show priority. Use color to communicate meaning, such as
`color="error"` on the confirmed Delete action. Use the same emphasis for peer
actions of equal importance.

For a custom page or toolbar action, start with a familiar leading `Icon` in
`#icon` and a visible verb label. Use a label alone when it is clearer than an
unfamiliar icon or when placement gives it meaning, such as Cancel. Use an
icon alone for familiar utilities or repeated row controls. Reuse the same
icon for the same action.

[ListView](../../packages/loom/src/components/views/ListView.vue) shows a leading
add icon with **Create**, named icon-only row controls, and a quiet **Cancel**
beside the destructive confirmation. See [Button](../../packages/loom/src/components/base/Button.vue)
for supported combinations of kind, variant, and color.
