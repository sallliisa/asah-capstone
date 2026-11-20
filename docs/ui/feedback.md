# Status and feedback

| Information | Placement |
|---|---|
| Saved record status | Use a labelled `Chip` beside the record or value it describes. Choose color for status meaning. |
| Field correction | Use Form's field error and helper text. |
| Problem or condition the user still needs to act on | Show an inline message near the affected content and keep recovery beside the message. Use `Alert` when the message needs visual emphasis. |
| Brief confirmation | Use the app's notification mechanism when the result is otherwise easy to miss. Reuse the result feedback from the View when it already reports the outcome. |

`Alert` supplies visual styling. For a dynamic message, choose the appropriate
announcement semantics at the message. Use `role="status"` for routine updates
and `role="alert"` for urgent errors that need immediate attention.

## Match the state to the next action

| State | What to show |
|---|---|
| First load | Keep the page structure recognizable. Show progress in the area that is loading. |
| Empty collection | Explain what has yet to be added. Show Create if it applies and the user can use it. |
| No filter matches | Keep the filters visible. Offer a way to clear or adjust them. |
| Access denied | State that access is unavailable. Offer a destination the user can open. |
| Failed load or rejected write | Show what failed and how to retry or correct it. Keep available data or draft input when possible. |
| Write succeeded and refresh failed | Say that the change was saved and the displayed data may be stale. Offer to refresh the data. |

Use the managed View or Table state before adding custom feedback. Give each
outcome one feedback owner. Keep the submit action unavailable during the write.
Report success after the write succeeds. See the
[ListView delete outcome](../../packages/loom/src/components/views/ListView.vue)
for inline recovery after a refresh failure and [FormView](../../packages/loom/src/components/views/FormView.vue)
for a saved form that can retry navigation. The [app toaster](../../apps/web/src/App.vue)
displays Sonner notifications.
