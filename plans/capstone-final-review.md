# Capstone decisions before implementation

Updated 17 November 2026. Implementation has not started, except for the
separately authorized activity-category seed.

This is the review entry point for the whole project. Approved decisions remain
approved. Recommendations below are concrete defaults for the remaining gaps.
They remain proposals until the user approves them. Approval of this record
does not itself start implementation.

Use the [workstream index](capstone-workstreams.md) for the agreed sequence,
owning designs, dependencies, delivery status, and continuation notes.

## Decisions already settled

| Area | Agreed result |
|---|---|
| Existing workflows | Keep Activities, independent work/payment states, recurring generation, and the existing room/account masters. Manual creation stays completed work with settled money when applicable. |
| Tenant histories | One activity keeps its room and an optional historical tenant reference. Both histories show that same activity. Attribution survives moves, move-out, and account deactivation. Corrections are explicit and audited. |
| Tenant grade | Combine associated repairs, extra cleaning, and rent. The grade follows the tenant across rooms. No stay record or reset per move is required. |
| Grade meaning | A Routine, B Check soon, C Check first. Show Not enough data separately. Association is not proof of fault or character. |
| Model timing | Automatic rolling 12-month window, 90-day recent patterns, at least 90 days of reliable records, and three due rent occurrences for repeated-payment patterns. Daily and event-driven refresh. |
| Business intervals | Monthly rent with no grace period. AC servicing every four months. Routine cleaning roughly twice a month with flexible dates. Extra cleaning is outside that routine. Owner-set tax reminders. |
| Synthetic assumptions | Ordinary corrective repairs 0–2 per room per year, usually 0–1 in 90 days. Extra cleaning 0–1 per room in 90 days. Approved B/C frequency examples guide evaluation. |
| Model/data policy | Isolation Forest for the attention model. Synthetic data is allowed for all custom models. Use public data when it fits; document assumptions and use independent evaluation data. |
| Pi and chat | Pi is CloudflareOS. Integrate Wisp. One shared CloudflareOS account configured through server environment settings. The user supplies the instance and account access. |
| Pi authority | Read-only for the first version, explicitly confirmed in this review. Pi reads and explains authorized data. It does not create/edit activities, settle payments, change tenants, or configure reminders. |
| Intent routing | Indonesian only. One public context tool calls the trained classifier and returns the selected private context document contents. Pi has no separate read/search/list access to those source documents. |
| RAG | Our pipeline uses Workers AI embeddings and Vectorize. Generation uses the model configured in CloudflareOS. Return source passages and references. |
| Guidance content | Assistant-authored Indonesian guidance is working policy until the user edits it. Live app facts still come from app tools. |
| Dashboard | Keep the existing structure. Financial filters default to This month and All rooms, with the approved other periods and room selection. Tenant grades have their own automatic window. |
| Notifications | Owner inbox at /notifications, unread state/count, and standard Web Push. Every newly created notification triggers a push attempt immediately. The owner's installed iPhone PWA is the primary device. |
| Hosting | Prefer external services. Use the 2 vCPU / 8 GB VPS for custom components we cannot offload. Hosted embeddings and vector storage stay outside the VPS. |
| Optional work | Occupant reports, WhatsApp, advance/repeated reminders, and future one-off scheduling are outside the initial delivery. |

## Remaining defaults I recommend

### 1. Pi reads through restricted tools

Expose only authorized read operations for rooms/tenants, activities, schedules,
financial summaries, and saved predictions. Do not provide generic app-admin
credentials, arbitrary SQL, or create/update/delete tools. Enforce this on the
backend as well as in the base agent skill.

Pi can explain how the owner changes a record and link to the app. The owner
makes the change through the existing form. Tool failures never become invented
balances, tenant grades, or activity states.

### 2. Shared owner chat and retained histories

The [Pi design](pi-chat/design.md) owns the connection and tool boundary.

Use the shared CloudflareOS account's owner workspace and native conversation
history. Authorized owner access is shared-account access, not a promise of
separate private chats for every app user. Tenant profiles do not grant chat
access. Keep native history for the assignment; do not add automatic deletion.

Use Wisp's Vue UI in one stable authenticated host. Clear its browser session
on logout. Native session issuance and allowed origins must be checked against
the supplied instance before wiring. Keep long-lived account secrets on the
server. A working native history reopen is an integration acceptance result,
not something the package selection alone proves.

Chat attachments stay in the native chat workflow. They do not automatically
become Activity receipts or trusted RAG documents. Use the user's configured
generation model and record its actual identifier in the delivery notes.

### 3. Intent labels and uncertain questions

Use five trained labels. Four are domain labels and one is rejection:

- Rooms, tenants, and maintenance, including tenant histories and attention grades.
- Schedules.
- Finances.
- Guidance.
- Out of scope.

Classify the requested result. Repair spending belongs to Finances, repair
history to Rooms/tenants/maintenance, and next service timing to Schedules.

For a mixed request, Pi splits it into self-contained questions and routes each
through the same public tool. This remains a single-label classifier per call.
For an unclear request or low validation-calibrated confidence, return a
clarification response without choosing an arbitrary document.

Follow-ups that need new domain data call the tool with a self-contained
question resolved from conversation context. Existing context can support a
simple restatement. Pi must not choose a new source document by itself.

If classification fails, report the failure and keep the ordinary app usable.
Do not silently replace the model route with an agent-selected private document.
Out-of-scope responses stay brief and invite a kos-related question.

Start with about 1,000 Indonesian examples across five classes, grouped by
template/paraphrase family for splitting. Use TF-IDF and logistic regression
first. Select confidence and score-gap thresholds using validation data. Report
macro-F1, class counts, confusion matrix, and routing outcomes. Dataset size and
model configuration are technical choices to adjust from observed errors.

### 4. RAG content and retrieval behavior

The [RAG design](rag/design.md) owns source preparation and retrieval.

Keep four small workflow context documents private to the backend. Maintain
separate editable Markdown sources for app help, tenant grading, routine kos
procedures, and basic maintenance guidance. The source corpus contains no live
tenant balances, receipts, current occupancy, or current predictions.

Use BGE-M3 as the initial Workers AI embedding candidate. Confirm its returned
vector shape before index creation. Split content at headings into roughly
300–500-token passages, with a small overlap where a section needs it. Store
document identity, version, heading, text reference, and content hash.

The context tool performs vector retrieval for accepted domain requests and
returns up to three relevant passages alongside the classifier-selected
workflow document. Apply area and active-version filters. Empty or weak results
return no supporting passages. Select relevance thresholds from answerable and
unanswerable Indonesian evaluation questions, rather than use an arbitrary
similarity value.

Pi cites document titles and sections for guidance claims. It says when the
documents do not contain an answer. Live totals use app calculations even when
retrieved text discusses finances. A retrieval outage must be explicit. A
correct live-data answer may still proceed after successful routing if it does
not require unavailable guidance.

Keep original passages and metadata in the app database or existing document
storage, with Vectorize holding vectors and references. Reindex changed sources
through a controlled ingestion command, verify the new version, then retire
old vectors. No new knowledge-management UI is needed initially. Do not index
chat uploads automatically or grant Pi direct source-store credentials.

### 5. Push on notification creation

The [notification design](notifications/design.md) owns the inbox and delivery workflow.

The user approved the simple creation-triggered direction. This behavior is
settled rather than a remaining proposed timing policy.

Send reminders to the configured owner account. Tenants do not receive app push
or rent reminders in the first version. Store subscriptions per signed-in user
and device. Removing a session removes its association with that device.

Whenever a new notification is saved, immediately attempt Web Push to the
recipient's subscribed devices. Recurring activity generation creates its due
notification, which follows the same rule. After downtime, newly created
notifications also trigger push, regardless of their occurrence dates.

Use one notification identity per recipient and occurrence. Repeated job runs
must not create another copy or send a new reminder for an existing notification.
Reading, editing, or leaving a notification unread does not trigger another
push. Remove expired subscriptions. A failed send leaves the saved inbox entry
available. Keep inbox history without automatic deletion for the assignment.

An installable PWA, permission flow, push handler, notification links, and clear
offline feedback are included. Offline record editing and background-sync writes
are outside the first version. Verify the owner journey on a real iPhone.

### 6. Service placement and scheduled jobs

Retain the existing Vercel web/API target, hosted Neon database, and S3-compatible
file-storage interface. Reuse the configured storage service rather than add a
second receipt provider. Account access and actual deployed availability still
need verification.

Host the small custom Python models on the VPS initially, with one serving
worker and bounded inference threads. Train offline. Use one VPS scheduler to
call authenticated app job endpoints every minute for recurrence, notifications,
and pending model work. Use the model design's daily assessment timing. Keep
durable progress in the app database so a restart resumes work.

Workers AI and Vectorize remain hosted. CloudflareOS hosts generation. We do
not need a local LLM, embedding runtime, or vector database on the VPS. Inspect
account quotas before setup and measure actual custom-service memory/latency.
Do not describe selected free allowances as a guarantee of zero total cost.

### 7. Tenant-model technical details

Use the existing [tenant assessment draft](room-detector/design.md) for cost
ranges, feature calculations, coverage, model comparison, persistence, access,
and failure handling. Its [delivery plan](room-detector/implementation-plan.md)
records order and proof. User-approved attribution and grade meanings are
settled. Numerical boundaries and reported performance come from evaluation.

### 8. Analysis, verification, and submission

Complete the three DS questions about pending work, cash changes, and records
needing attention. Derive findings from the same sample records as the app.
Keep current factual overdue lists independent of model availability.

Check ordinary owner flows, tenant moves with preserved history, receipt upload,
recurrence catch-up, inbox/push, classifier routing, cited retrieval, service
failure, and saved chat/prediction reopening. Reuse existing credible proof.
Select new tests through the project's verification and test-audit skills.

Update the formal plan to monthly rent and the tenant-associated model scope.
Finish the README, data dictionary, notebooks, API contract and interactive
docs, schema, Project Brief, usage guide, slides, video, and owner trial record.
Synthetic evaluation does not prove real-world accuracy or business impact.

## What still depends on setup

The user supplies CloudflareOS access and the ready instance. Verify its native
session handoff, read-only tool grants, context restrictions, configured model,
and history. Verify deployed domains, database/storage access, hosted AI quotas,
VPS reachability, and the real iPhone push flow during integration.

These are availability and acceptance checks. They do not require another round
of product design. A concrete incompatibility returns as a focused issue with
evidence and a recommended adjustment.

## Approval boundary

The user approved all planning documents and authorized implementation at the
checkpoint. The recommendations in this record are now approved. Earlier
proposal wording does not require another approval.

Read-only Pi and push on notification creation are approved. Previously agreed decisions retain approval. The new
defaults in this review remain proposals. Once reviewed, routine file names,
dependency pins, thresholds selected by experiments, and equivalent local
implementation details can be handled without separate product discussions.
Implementation still waits for the user's instruction to start.

## Sources checked

- [Wisp](https://github.com/southneuhof/wisp) documents its Vue UI, stable host, native sessions, and conversation access. Actual instance compatibility remains unverified.
- [Cloudflare BGE-M3](https://developers.cloudflare.com/workers-ai/models/bge-m3/) documents the hosted embedding candidate.
- [Vectorize pricing](https://developers.cloudflare.com/vectorize/platform/pricing/) documents current hosted allowances and usage billing.
- [WebKit Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) documents Home Screen web push and user-triggered permission on iPhone.
