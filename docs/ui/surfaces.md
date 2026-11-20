# Page surfaces

Read this file to compose page sections or extend a standard View. Use the
[page structure rules](../../DESIGN.md#page-structure) to decide the order and
placement of sections.

## Page composition

| Content | Treatment |
|---|---|
| Record summary or distinct work area that needs a boundary | Keep the standard View card or use a neutral `Card`. Match the surrounding Views. The standard detail card uses `variant="outlined"` and `color="surfaceContainer"`. |
| Short supporting content with a clear heading | Use an unframed section when its heading and spacing give it a clear boundary. |
| Supporting content that the user can skip | Use `Disclosure`. Keep facts and controls needed for the next action visible on entry. |
| Related records with their own rows | Give the collection a section below the summary. Keep its heading, contents, and controls together. |

Use section order and headings to give important content more prominence. A
`Card` variant controls the surface treatment. `outlined` adds a border.
`elevated` adds a shadow. The color selects a theme role. See [Card](../../packages/loom/src/components/base/Card.vue).

Use a whole-card action when the card has one clear action. A click handler on
`Card` gives it button behavior. For a card with several actions or a link,
keep the card structural and give each control its own target.

## View slots

Keep the standard View for its usual task. Use the smallest extension that
serves the change.

| Change | Extension |
|---|---|
| Render one detail field differently | Use `DetailView #value:<key>`. |
| Add a record command or collection action | Use the [action slots](actions.md#place-the-action). |
| Add a section about the same record | Place it next to the standard `DetailView` in the page layout. |
| Show a summary tied to the current list query | Use `ListView #context` above the results. |
| Change the layout of ready list records | Use `ListView #collection` to keep the managed collection states and pagination. Pass the original record to the supplied row actions. |
| Change fields or controls inside a managed form | Use `FormView #input:<key>` or `#actions`. |

Use `#body` when the task needs to replace the standard body. Compare the
replacement with the standard View in source.

| View | What `#body` replaces |
|---|---|
| [DetailView](../../packages/loom/src/components/views/DetailView.vue) | The standard detail card and its field layout. If the replacement uses `Detail` for the ordinary summary, keep the standard card treatment. |
| [ListView](../../packages/loom/src/components/views/ListView.vue) | The managed Table inside the results card. The replacement owns any Table behavior it needs. |
| [FormView](../../packages/loom/src/components/views/FormView.vue) | The managed Form inside the card. The replacement owns form behavior supplied by the default Form and its controls. |

Standard surface components own their loading, error, and empty presentation.
Route-local layout owns only the domain sections that the standard surface
cannot express.

## Row operation sync

Permission in `actions` decides role access; the row `allowedOperations`
array decides this-row access when present, and omission hides by design.
`list` and `create` never gate by row. A resource that declares a row action
must carry that name in the row `allowedOperations`, or stay explicitly
list-only (no detail declaration) or collection-only (never called with a
row). See plans 047 and 048.
