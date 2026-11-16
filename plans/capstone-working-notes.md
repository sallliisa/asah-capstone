# Capstone working notes

Updated: 2026-11-17, Asia/Jakarta.

This is our working record for Kos De Mansion. It records the project review,
agreed decisions, proposals, and open questions from our discussion. The
[formal project plan](<../Project Plan - A26-CS299.md>) remains the submission
document. Existing module designs retain their current contracts unless an
agreed decision here explicitly changes them.

We are discussing the work one topic at a time before implementation. Approval
of a proposal records the agreed direction; it does not start implementation.
The user separately authorized the activity category seed. That change and its
runtime checks are recorded below.

## Decisions we have agreed on

The [whole-project final review](capstone-final-review.md) collects the remaining
recommended defaults for later approval. It separates settled scope from
implementation choices and setup checks.
The [workstream index](capstone-workstreams.md) links the feature designs and
records the agreed sequential work order and delivery status.

| Topic | Decision | Delivery status |
|---|---|---|
| Working approach | Discuss each feature in detail before building it. Use the existing app and keep the scope practical for the user and assistant doing the work. | Discussion continues. |
| Pi | Pi means CloudflareOS. The user will prepare its instance and tell us when it is ready to connect. | Integration pending. |
| Pi authority | Read-only for the first version. Pi can read and explain authorized records and guidance, but cannot create/edit activities, settle payments, change tenants, or configure reminders. | Explicitly approved during the whole-project review. |
| Chat integration | Use [Wisp](https://github.com/southneuhof/wisp) to connect the app's chat experience to CloudflareOS. This resolves the earlier Spool link. | Library selected; integration pending. |
| CloudflareOS account | Use one shared CloudflareOS account for the whole app, with configured values in `.env`. The user owns access and account setup. | Account strategy settled; setup belongs to the user. |
| RAG | Build our own retrieval pipeline with hosted embeddings from Workers AI and vector storage in Vectorize. Expose retrieval as a tool that Pi can call. | Approach agreed; implementation pending. |
| Intent routing | A base skill calls one context tool. A trained classifier selects a private backend document, and the tool returns its contents. The agent has no separate access to area documents. The tool can run vector retrieval internally when needed. | Routing architecture approved; remaining classifier behavior and implementation pending. |
| Language | Support Indonesian only for intent classification and the initial context/RAG content, including informal Indonesian. | Language scope agreed. |
| Knowledge content | The assistant can write complete operating guidance from reasonable assumptions. Treat it as current working policy in Pi until the user edits it. | Authoring approach agreed; content drafting pending. |
| Model data | There is no access to real kos data. Synthetic examples are allowed for all models. Prefer suitable public datasets where available; synthetic data is an accepted fallback. | Data policy settled; dataset selection and preparation pending. |
| Hosting | Prefer external managed services. Host the components we cannot offload on the user's 2 vCPU / 8 GB RAM VPS. Workers AI and Vectorize remain hosted as agreed. | Hosting policy settled; service placement and setup pending. |
| Tenant attention grade | Assess associated repairs, extra cleaning, and rent across a tenant's rooms. Use coherent synthetic tenant histories and app-equivalent inputs. The grade follows the tenant across room changes. | Direction approved; dataset and implementation pending. |
| Activity attribution | Keep one activity with its room and an optional historical tenant reference. Room and tenant histories show the same record. Preserve attribution after moves and deactivation; allow explicit audited corrections. | Approved direction; no separate activity copies or mandatory stay record. |
| Detector measurements | Use corrective-repair frequency and recorded expenses, extra-cleaning frequency with routine-cleaning context, and rent payment delays and overdue amounts. Keep planned upkeep separate. Routine cleaning is roughly twice a month without fixed dates. | Initial approach approved; cleaning timing clarified by the user; exact formulas and data contract pending. |
| Detector eligibility | Start with 90 days of reliable recording coverage. Require three due rent occurrences for repeated-payment patterns. Show Not enough data where required inputs are missing, while showing known overdue facts immediately. | Initial rules approved; check them during evaluation. |
| Detector scoring | Use one Isolation Forest model for the three areas. Select A/B/C score boundaries with validation cases and keep factual overdue alerts visible beside the grade. | Approach approved; model, boundaries, and any severe-overdue override remain pending. |
| Grades | Use three tenant-attention levels: A · Routine, B · Check soon, and C · Check first. Show Not enough data separately. The grade summarizes associated records, not proven responsibility. | Meaning and display scale agreed; thresholds and model implementation pending. |
| Payment timing | Rent is due monthly with no grace period. Payment after the expected date is late; unpaid rent becomes overdue after that date. | Assumption selected by the user; lateness alone does not force C. |
| Synthetic normal frequencies | Use 0–2 corrective repairs per room per year, usually 0–1 in a 90-day period. Use 0–1 extra cleanings per room in a 90-day period as the ordinary pattern. Allow variation in dates. | Approved synthetic-data assumptions; not measured business rates. |
| Detector operation | Use the last 12 months of associated tenant history automatically. Refresh daily for current tenants and after relevant changes. Show the grade on the tenant profile, with current-tenant summaries on room views and a dashboard list of unique tenants. | Direction approved; implementation pending. |
| Dashboard filters | Default financial analysis to This month and All rooms. Offer Last month, Last three months, a custom date range, and a room filter. Apply the same filters to cash totals and financial charts. Keep the detector's 12-month window separate and labelled. | Approved; implementation pending. |
| Notifications | Add an authenticated `/notifications` inbox and standard Web Push for the same saved notifications. | Scope approved; implementation pending. |
| Primary device | The owner will use an iPhone with the app installed as a Home Screen PWA. Treat that device as the primary notification target. | Device-specific implementation and live proof pending. |
| Push trigger | Every newly created notification immediately triggers a push attempt to subscribed devices, including notifications created after downtime. Repeated jobs and unread state do not create repeated reminders. | Approved. |

## What the project already has

The source review found these application features:

- Login, users, roles, and permissions.
- Rooms, room types, rent amounts, and occupant assignments.
- A room grid that shows occupancy and opens room details.
- Activity categories and activity records.
- Separate work and payment states during activity follow-up.
- Receipt attachment support.
- Recurring plans and automatic creation of due activities.
- Income & Expenses, list filters, and filtered financial totals.
- Dashboard panels for rooms, Needs attention, Upcoming plans, and cash charts.
- Vercel configuration and generated OpenAPI JSON.

These are source observations, not a claim that every flow has passed a current
live check. Earlier delivery notes record passing checks and remaining proof:
[Rooms](rooms/delivery.md), [Activities](activities/verification.md), and
[Dashboard](dashboard/verification.md). Later dashboard notes include some
screen-size proof; the full owner journey and live receipt upload path remain
unverified in this review.

### Scheduling already exists

The initial review overstated the scheduling gap. We do not need to rebuild
recurring scheduling to add notifications.

[`generateDueActivities()`](../apps/api/src/routes/%28authenticated%29/recurring-plans/generate.ts)
creates an activity when a recurring occurrence becomes due. For example, a
plan for AC service every four months produces a Planned activity for each due
date. A financial occurrence starts with Draft payment state. The operation
advances the plan's next date and prevents duplicate plan/date occurrences.

The local server runs this operation at startup and every minute. The reviewed
[Vercel entry point](../apps/api/vercel.mjs) does not call or schedule it. We need
a production execution path that works when no user has the app open. The job
provider and execution frequency are not selected yet.

Upcoming plans and Needs attention already show schedules and pending work on
the dashboard. The missing feature is the dedicated notification inbox and
push delivery.

Manual activity creation currently records completed work and settled money
when financial details are present. A separate flow for future one-off work
was proposed, but was not approved. Leave that contract unchanged while we
work on recurring reminders. See the [Activity design](activities/design.md).

## Notifications and the iPhone PWA

This scope was approved in the discussion. The user explicitly asked to lock it
in and identified the iPhone as the device to support.

### Inbox behavior

- Save notifications in the application database for their recipient.
- Show them at `/notifications`, newest first.
- Provide All and Unread filters, read state, and Mark all as read.
- Show an unread count beside the navigation entry.
- Link each due notification to its activity.
- Reading a notification does not complete work or settle payment.
- Keep the inbox available when push is disabled, unsupported, denied, or fails.

### Push behavior

1. A scheduled backend job uses the existing recurrence operation to create due
   activities.
2. It saves the recipient's notification without creating another copy for the
   same occurrence on a repeated run.
3. Saving the new notification immediately triggers a Web Push attempt to the
   recipient's subscribed devices. Newly created notifications after downtime
   follow the same rule, regardless of occurrence date.
4. The device displays the notification.
5. Tapping it opens or focuses the app at the related activity. An expired
   session requires login before protected data can be read.

Add an explicit Enable push notifications on this device control. Installation
alone does not grant notification permission. Each device/browser subscription
belongs to the signed-in user. Remove its user association on logout or account
change. Notification reads and activity links remain subject to backend access
checks.

Use HTTPS and a service worker for the standard Web Push approach we discussed.
Store subscriptions on the backend and use application server keys for sending.
A separate paid notification platform is not required. Hosting and scheduled-job
usage remain separate costs.

### iPhone requirements and delivery limits

- Support Web Push for Home Screen web apps on iOS/iPadOS 16.4 and later.
- Request permission after a direct user action, such as tapping Enable.
- Check support at runtime and provide installation or settings guidance when
  needed.
- Confirm permission, delivery, notification taps, and login return behavior on
  an actual iPhone before claiming support is complete.
- Treat push as best-effort delivery. Connectivity, device settings, Focus, and
  message expiry can affect what the owner sees and when.
- A successful send does not prove that the owner read the notification.
- The saved inbox is the record of notifications even if no push arrives.

The repo has a basic manifest, with placeholder app names, but the review found
no service-worker registration or push implementation. PWA setup and push
delivery still need development. Offline application behavior was not agreed.

Push follows notification creation without a separate send-time or age policy.
Repeated jobs do not recreate or resend an existing notification. Read state
does not cause another push. The [final review](capstone-final-review.md#5-push-on-notification-creation)
records the same rule. Advance reminders and repeated overdue pushes remain
outside the initial scope.

References: [Apple Web Push support](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/),
[Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API),
[subscription flow](https://web.dev/articles/push-notifications-subscribing-a-user),
[notification taps](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event),
and [Web Push protocol](https://web.dev/articles/push-notifications-web-push-protocol).

## Pi, CloudflareOS, and the chat UI

Pi is the name used for CloudflareOS in this project. It does not name a
separate chatbot service that we must build. The user will prepare the instance
and tell us when it is ready to connect.

The user owns access and account setup. Use one shared CloudflareOS account for
the whole app, with fixed account settings supplied through `.env`. Separate
CloudflareOS accounts or per-user account linking are not requested. Treat
workspace and conversation access as shared-account access; separate native
history for each application user was not promised.

We still need to connect Wisp, application tools, and retrieval, and confirm
history reopening and error behavior. Existing CloudflareOS history does not
yet establish that the app can meet the project plan's history requirement.

The selected library is [Wisp](https://github.com/southneuhof/wisp). The user
confirmed this link after the earlier Spool reference. The chat-library choice
is settled.

### Wisp integration

The reviewed [README](https://github.com/southneuhof/wisp/blob/main/README.md) and
[integration guide](https://github.com/southneuhof/wisp/blob/main/docs/agent-integration.md)
describe a Vue UI package, `@southneuhof/wisp-vue-ui`, with sign-in, workspace and
conversation selection, streaming replies, model selection, and attachments.
This is the proposed package for our Vue app. The exact package version and
presentation are still to be checked at integration time.

Wisp connects from the browser to CloudflareOS through its native Cap'n Web
`/api` interface. It provides the chat connection and UI; our RAG pipeline and
application-data tools remain separate backend responsibilities.

The documented integration uses one host in a stable layout, kept mounted
across route changes. Match its theme to the app and check its panel and
composer with the existing navigation pill on the owner's iPhone.

The CloudflareOS URL must be browser-accessible, and the instance must allow the
app's origin. Generation models are configured in CloudflareOS. Wisp supports a
native CloudflareOS session handoff; an app cookie or unrelated JWT cannot serve
as that session. Coordinate the connection with the user's shared-account setup.
Clear the browser's Wisp session when the app signs out.

Keep shared credential values in server-side `.env` settings. The instance URL
can be public configuration. Do not turn account passwords or long-lived secrets
into `VITE_` variables bundled with the app. Wisp can receive the native session
through the authenticated app flow. The user owns account provisioning and
access configuration; this note does not add a new account-management workflow.

Wisp exposes native conversations and restores selections through per-tab
storage. Check that its history access meets our ownership, access, and
reopening requirements before adding separate application chat storage. A live
round trip and iPhone behavior remain unverified until the instance is ready.

The two agreed parts fit together as follows:

- App chat UI → Wisp → CloudflareOS/Pi.
- Pi → authorized application-data tools → current records and calculations.
- Pi → our retrieval tool → Workers AI embeddings and Vectorize → source
  passages → Pi's cited answer in Wisp.

Pi should use backend tools for application records and calculations, with the
same access rules as the application. The intended question sources are:

| Question | Source |
|---|---|
| How much did we spend on AC repairs this month? | Application API calculations from recorded payments. |
| What should I check when an AC leaks? | Retrieved passages from approved guides. |
| Room 12 keeps needing repairs. What should I check? | Application history and model results, plus relevant guide passages. |

Keep current totals and room status authoritative in the application API. The
exact tool list, generation provider/model, prompt, timeouts, cost limits, and
history retention remain open. The account strategy is settled above. The
formal plan requires saved chat and
prediction history, clear service-failure messages, and rejection of at least
10 questions outside the business context. Core activities and finances must
remain usable during AI failures.

CloudflareOS supports external tools through its
[MCP gatekeeper](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-mcp/README.md).
The exact integration must be checked against the user's running version. The
[Context Library search reviewed](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-context/src/context-collection.ts)
used keyword matching; it did not establish the embedding/vector retrieval
required for this assignment.

## RAG approach

### Assignment interpretation

The user supplied this requirement:

> Membangun sistem RAG yang terdiri dari model generation (API proprietary atau
> SLM/LLM open-source yang di-host lokal), model embedding, dan vector database
> (ChromaDB, FAISS, Pinecone, Weaviate).

The user confirmed that the named databases are examples. Whether the full
assessment rubric accepts a fully managed pipeline remains uncertain. Our
interpretation is that the quoted wording permits one, but that is not an
assessor's confirmation.

The agreed approach uses managed components while we build the pipeline. This
keeps the embedding model, vector database, and our contribution clear for the
assignment, without requiring a separate database server or local model host.

### Agreed structure and proposed model

| Component | Choice |
|---|---|
| Generation | Use the LLM configured for Pi; provider/model still open. |
| Embeddings | Workers AI hosted embedding model. BGE-M3 is the proposed multilingual starting candidate, not a final evaluated choice. |
| Vector database | Cloudflare Vectorize. |
| Retrieval access | A backend document-search tool that Pi can call in CloudflareOS; Wisp displays the conversation in our app. |
| Pipeline work | Our document preparation, chunking, indexing, retrieval, source references, answer rules, and evaluation. |

The search tool is the retrieval entry point. The complete RAG system also
includes document indexing and the LLM's use of retrieved passages:

1. Split approved documents into passages and retain their source and section.
2. Embed the passages and store vectors with passage references.
3. Embed the user's question and search Vectorize.
4. Return relevant passages and source references through the backend tool.
5. Let Pi generate the answer using those passages and cite supporting sources.

We do not need a second chatbot model for RAG or an intent classifier before
retrieval can work. A pretrained embedding model is a valid starting point;
training our own embedding model was not agreed.

Initial document scope is app help, working kos procedures, and basic
maintenance guidance. The user authorizes the assistant to write complete
Indonesian documents from reasonable operating assumptions and will edit them
later. Treat the authored guidance as current working policy for Pi, rather than
fictional examples or placeholders. Pi need not repeatedly disclaim those
assumptions. The Markdown source remains editable and authoritative for that
guidance.

Live room, payment, schedule, and prediction facts still come from application
records. This content decision does not change synthetic dataset provenance.
Decide passage storage, chunking, updates/deletions, retrieval settings, and
access filtering before implementation. Relevant answers need supporting
sources; information absent from the documents needs an explicit unavailable
answer.

Proposed evaluation covers Indonesian paraphrases, mixed data/document
questions, missing information, conflicting or irrelevant documents, and
questions outside the business context. Save retrieved passages and final
answers so we can assess retrieval and generation separately.

### Hosting options we considered

Prefer external services when they can host a component. Use the user's VPS,
with 2 vCPU and 8 GB RAM, for components we cannot offload, including custom model
services when suitable hosted options are unavailable. Isolation Forest and
intent-classifier serving are candidates for this host; their final deployment
details remain open.

The user's initial statement that everything would run there was clarified:
the VPS is the fallback host, not a requirement to move all services onto it.
Workers AI embeddings and Vectorize remain hosted as agreed. This also does not
require local generation-model hosting. Earlier capacity comments about local
Chroma and embeddings were estimates, not VPS benchmarks.

Provider allowances below were checked on 2026-11-17. They are planning notes;
check current pricing, account eligibility, and shared usage before setup.

| Option | Allowance discussed | Decision |
|---|---|---|
| Workers AI + Vectorize | 10,000 Workers AI neurons/day; Vectorize has 5 million stored dimensions and 30 million queried dimensions/month on Workers Free. | Selected approach. Embedding quota is shared with other Workers AI calls. |
| Pinecone Starter | 2 GB database storage and 5 million embedding tokens/month for multilingual-e5-large, with other usage limits. | Managed alternative; not selected. |
| Qdrant Cloud Free | 1 GB RAM, 4 GB disk, 0.5 vCPU; external embeddings required. Inactive clusters can be suspended and deleted. | Alternative; not selected. |
| Cloudflare AI Search | Included monthly usage of 5 million ingestion tokens, 10 GB-month storage, and 1,000 semantic queries. | Fully managed pipeline considered; not selected. |
| Chroma or FAISS with a small local embedding model | Open-source software on our own compute. Multilingual E5 Small was suggested as an embedding candidate. | Self-hosted alternatives; not selected. |
| Weaviate | Open-source database with Docker deployment. | Considered; not selected. |

Free software does not supply free compute. Retrieval allowances also do not
cover all generation-model, CloudflareOS, and application-hosting costs.

References: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/),
[BGE-M3](https://developers.cloudflare.com/workers-ai/models/bge-m3/),
[Vectorize pricing](https://developers.cloudflare.com/vectorize/platform/pricing/),
[AI Search architecture](https://developers.cloudflare.com/ai-search/concepts/how-ai-search-works/),
[AI Search pricing](https://developers.cloudflare.com/ai-search/platform/limits-pricing/),
[Pinecone pricing](https://www.pinecone.io/pricing/),
[Qdrant free clusters](https://qdrant.tech/documentation/cloud/create-cluster/),
[Chroma](https://docs.trychroma.com/docs/overview/introduction),
[FAISS](https://github.com/facebookresearch/faiss),
[Weaviate](https://docs.weaviate.io/weaviate), and
[Multilingual E5 Small](https://huggingface.co/intfloat/multilingual-e5-small).

## Model data policy and public dataset candidates

The user confirmed that no real kos data is available and that synthetic data
is allowed by the assignment for all models we build. We can proceed without
obtaining private operational records. Prefer public data when it fits the
task; use synthetic examples where suitable public data is unavailable or
incomplete. A public dataset is not automatically a better fit for our domain.

Record each dataset's source, license, preparation, and synthetic/public origin.
Keep training, validation, and test data separate. Describe results according to
the data used; simulation is an accepted project route, not a blocked condition.
This policy does not require training a generation or embedding model from
scratch.

An initial source search found the candidates below. A later
[dataset check](anomaly-dataset-review.md) inspected the FMUCD published schema,
NYC residential complaint metadata and a sample, and six CSVs from public
synthetic sources. That record contains the field mapping, inspection results,
access limits, and recommendations. The user then selected one coherent
synthetic dataset for the combined tenant assessment. Its exact records and feature
contract are not built, and no model has been trained.

| Candidate | Possible use | Fit still to check |
|---|---|---|
| [Facility Management Unified Classification Database](https://data.mendeley.com/datasets/cb8d2nsjss/1) | Public maintenance records from 12 US/Canadian universities, with work orders, costs, components, and other attributes. The dataset page lists CC BY 4.0. Could inform maintenance features and synthetic scenarios. | University-building records differ from Indonesian kos rooms. Inspect fields, units, granularity, and labels before deciding whether to train on them or use them as references. |
| [Amazon MASSIVE](https://huggingface.co/datasets/AmazonScience/massive) | Public intent-classification data that includes Indonesian and lists CC BY 4.0. Could supply general language or out-of-domain examples. | Its assistant intents are not our four kos intents. Suitable mappings and any synthetic domain examples need review. |

For the anomaly model, define normal and unusual maintenance scenarios and
observable features before generating synthetic histories. Public data can
support that design if it provides useful evidence.

## Tenant grades: agreed meaning

Use the tenant assessment to help the owner decide which tenants need a review,
with separate repair, cleaning, and payment reasons.
The user approved a reduction from A–E to three levels. The formal project plan
is updated to A–C to match this decision.

| Grade | Display label | Meaning |
|---|---|---|
| A | Routine | No unusual pattern in the tenant's associated records. |
| B | Check soon | Some unusual activity deserves a review. |
| C | Check first | Strong unusual patterns; review this tenant's records first. |

Not enough data is a separate state. A tenant with no reliable activity history does
not automatically receive A. Grades indicate owner-attention priority, not a verified
assessment of physical condition.

Keep a continuous anomaly score for ordering tenants within a level. Select grade
thresholds using validation data; do not force equal numbers of tenants into each
grade. Show the letter with its action label and a short explanation grounded
in recorded facts, such as three AC repairs in two months.

Corrective repairs means incidental repairs after a fault occurs, such as a
leaking AC or broken lock. The user approved their inclusion and also wants
cleaning considered. Distinguish planned servicing and routine cleaning from
corrective work when defining signals. Regular cleaning alone does not establish
a problem.

The initial measurements, minimum history, and scoring approach below are
approved. Exact feature formulas and grade thresholds still need development
and evaluation. No model or grade calculation has been implemented.

The user approved a rolling 12-month history window, daily recalculation, and
recalculation after relevant activity or payment changes. Show the grade on the
tenant profile and current-tenant room summaries. Add a dashboard list of unique tenants ordered by priority, with the
reasons beside each grade. These are agreed delivery requirements; the fitting
dataset and model calculations remain to be developed.

### Tenant-associated assessment: selected direction

Only use model variables with a verified training source and equivalent app
values at scoring time. The [dataset check](anomaly-dataset-review.md) takes
precedence over the unverified candidate signals below. FMUCD alone does not
support the full room, rent, and cleaning detector. The user selected a coherent
synthetic dataset for this scope. Its tenant and room identities and timeline must be
consistent across the three domains. Create the dataset/feature contract before
generating records or training.

The user selected a combined tenant assessment after the dataset discussion.
Rent, cleaning, and repairs are included in its intended scope. The initial
measurements and combined-model approach below are approved. Exact formulas
and grade boundaries remain pending. The formal plan currently
describes maintenance anomaly detection and still needs a scope revision to
match the broader detector; its A–C scale is already updated.

Candidate rent signals are overdue scheduled rent, payment delay, and repeated
late payments. Rent price alone is not a proposed problem signal. The existing
scheduled financial activities have an expected date and actual payment date;
manual activities have no expected date. Identify rent records explicitly and
use only records with sufficient dates for delay calculations. Current room
occupancy is not historical tenant attribution. The approved direction adds an
explicit tenant reference to each relevant activity. Do not infer past tenant
associations from today's occupant or assume that association proves fault.

The approved approach keeps direct overdue checks for scheduled rent alongside
the anomaly model. Routine cleaning has no fixed work deadlines. Show the separate
maintenance, cleaning, and payment reasons even if the UI later combines them
into one priority. Grade boundaries and any severe-overdue override remain
technical proposals. A move does not reset the tenant's grade. This scope adds no tenant billing or partial-payment
workflow.

### Tenant history across moves: agreed

An activity remains one room-linked record and can also carry a historical
tenant reference. The tenant's activity history shows that record across room
changes, move-out, and account deactivation. Previous tenants, unpaid rent,
saved predictions, and source room context remain available to authorized
owners. Corrections appear in both views and preserve an attribution audit.

The grade belongs to the tenant and aggregates associated events across rooms.
A move does not reset it. A new room occupant does not inherit the previous
tenant's events. No stay record is required for this version. Dates still
support the automatic 12-month window, 90-day patterns, payment delays, and
minimum evidence. The owner does not select an assessment date range manually.

The grade is a reason to review associated records. It does not establish that
a tenant caused repairs or extra cleaning. All model identities are grouping
keys, not numerical features. The detailed draft is the
[tenant assessment design](room-detector/design.md).

### Category seed: completed

On 17 November 2026, the user authorized seeding the existing Activity Categories
master. The boarding-house seed now includes Corrective Repairs, Scheduled
Servicing, Routine Cleaning, Extra Cleaning, and Room Rent, alongside General.
These values were applied to the configured development database. A fresh read
and a repeated seed confirmed six categories and no change to existing category
records. The seed preserves existing names and IDs on conflict. It creates no
sample activities or plans. API lint and type checks passed; the master UI has
not been checked in a browser for this change.

### Detector measurements and scoring: approved direction

On 17 November 2026, the user approved the proposed measurements, initial
minimum-history rules, and single-model scoring approach below. Detector
implementation remains pending. The agreed 12-month window and A–C meanings
remain in effect.

Use one feature calculation for both the synthetic training histories and app
records. Calculate each room snapshot using only records available on that
snapshot date. Keep rooms and related histories separate between training,
validation, and final evaluation to prevent leakage from repeated snapshots.

| Area | Approved initial measurements | Limits |
|---|---|---|
| Repairs | Completed corrective repairs in the last 90 days; corrective repairs per 30 observed days over the available 12-month window; recorded settled corrective-repair expense per observed month. | Scheduled servicing is separate. An unknown amount is not zero. Room/category repetition does not prove that the same asset failed again. |
| Cleaning | Completed extra-cleaning events per observed month. Use recorded routine-cleaning frequency as context for the approximate twice-monthly practice. | Routine dates are flexible. Do not derive cleaning overdue days or missed-deadline shares from this practice. Routine frequency alone is not a problem signal. No cleanliness score or work duration can be inferred. |
| Rent | Late-payment share of due rent occurrences; mean delay of settled late payments; oldest unpaid due rent age; known overdue amount relative to the amounts due in the same window. | Use explicit tenant-associated Room Rent activities with due dates. Ad-hoc payments have no expected date. Unassigned historical events stay outside the tenant model. |

Use completed work for repair and extra-cleaning counts. Use settled expenses
for recorded repair cost. Treat missing cost coverage separately; do not claim
the recorded spend is the full economic cost. Rent checks use the payment
state, independently of the work state. A cancelled work state does not cancel
a draft rent payment under the current contract.

Routine cleaning is roughly twice a month, with no fixed dates. Extra cleaning
is any cleaning outside that routine. Synthetic routine-cleaning dates must
allow variation rather than enforce an exact 14-day or 15-day interval. The
routine frequency is context, not a strict monthly quota. Cleaning deadline
features are excluded from the current scope because no deadline is defined.

The Activity occurrence date is a work due date only for non-financial work.
For income or expense records, it is the expected money date. A financial
cleaning or servicing record therefore cannot supply a work deadline either.
Do not add unsupported fields to the synthetic dataset and assume the app can
provide them.

Start with 90 days of confirmed recording coverage before a model grade. Use
three due rent occurrences before interpreting a repeated-payment pattern.
These are initial evaluation choices, not established statistical guarantees.
Use up to 12 months when available; a tenant need not wait a full year. Coverage
starts when reliable recording starts, not on the first repair. An old room
or account creation date alone does not prove that its activity history is complete.

No repair events can be a valid zero when recording coverage is known. Missing
rent or cleaning coverage is not a healthy zero. Show coverage by area and keep
the full grade at Not enough data when required inputs are unavailable. Show
known overdue facts immediately, including for rooms that cannot yet be graded.
Use synthetic evaluation cases with different history lengths and rent
intervals to check whether these initial eligibility rules need adjustment.

Use one Isolation Forest model with a small set of repair, cleaning, and rent
features. Avoid an arbitrary weighted sum of three hand-built scores. Compare
the required baseline, engineered-feature version, and tuned version with the
same splits. Select two A/B/C score boundaries on validation scenarios, then
check them on a separate labelled evaluation set. Do not force a fixed share
of rooms into B or C. Include healthy but unusual scenarios, such as expensive
planned servicing and frequent routine cleaning, to check false alerts.

Isolation Forest supplies anomaly scores; its output is not a direct measure
of business severity. See the official
[Isolation Forest documentation](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html).
Keep direct overdue alerts visible beside the model grade. Display factual
reasons from the records, such as three repairs in 60 days or rent 14 days late;
do not present them as exact model feature contributions. Any policy that
forces a severe overdue case into C needs an explicit business threshold and
separate validation. That threshold remains open.

### Example room histories: draft for discussion

The [example histories](room-detector-scenarios.md) propose A/B/C priorities for
ordinary rooms, repair and cleaning patterns, repeated late rent, substantial
unpaid rent, planned upkeep, and incomplete history. The user agreed to walk
through examples; these individual labels and numbers are not yet approved.
They are discussion examples, not model predictions, universal thresholds, or
generated training records. No model or application implementation was started.

### Operational intervals

Rent is paid every month. Use monthly rent in the design and synthetic examples.

AC servicing is every four months per room. Routine cleaning is approximately
twice a month with flexible dates, as confirmed by the user. Extra cleaning is
anything outside that routine. The owner sets tax-season dates for their own
reminders. Tax timing is outside the custom tenant model. Monthly reporting does
not establish a monthly interval for every operational activity.

Rent has no grace period. A payment after its expected date is late. Unpaid
rent is overdue from the following date, using the application's Asia/Jakarta
calendar dates. The duration, repetition, and outstanding amount still determine
how concerning the recorded pattern is; one late day does not automatically
force C. No fees or penalties are introduced by this assumption.

### Corrective repairs and extra cleaning: approved synthetic assumptions

Every corrective repair records an unwanted incident, but an occasional
completed repair does not automatically make the room B or C. Include
isolated repairs in the normal synthetic histories. Increase review priority
for repeated recent corrective work and unusually high recorded repair costs.
Do not infer physical danger, unresolved faults, or repeated failure of the
same asset from counts and expenses alone.

The user approved the normal frequencies and repair/cleaning examples below.
Use 0–2 corrective repairs per room per year as the ordinary synthetic range,
usually 0–1 in any 90-day period. These are incidental events, without a fixed
recurrence. Keep the scheduled four-month AC servicing separate from this
count. One isolated completed repair with ordinary recorded cost can remain A
when the other areas are routine.

Use 0–1 extra cleanings per room per 90 days as the ordinary synthetic range,
in addition to roughly two routine cleanings per month. Some quarters can have
none. Do not schedule an extra cleaning every quarter by definition. Repeated
extra cleaning is a review signal, not proof of poor cleanliness or tenant fault.

Use three repairs in 90 days as an illustrative B case, and six repairs in
60 days as an illustrative C case. Use three extra cleanings in 90 days as an
illustrative B case, and six to eight in 90 days as an illustrative C case.
These examples guide scenario labels; they are not hard-coded model rules.
Include variations around them and check the resulting model with independent
evaluation histories. The normal ranges are explicit synthetic assumptions,
not measured rates from this business. Cost ranges still need definition.

Tax reminders and monthly report timing are outside the tenant model's input
contract. A/B/C meanings are settled: Routine, Check soon, and Check first.
No payment grace period is assumed. Numerical score boundaries still need
validation under these agreed meanings; that does not reopen the grade meanings.

## Intent classifier discussion

The user confirmed that the assignment requires classification results to route
questions. Passive observation is therefore excluded as the integration design.
The user approved a base CloudflareOS skill plus private area-specific
context documents and one public context tool. The tool invokes the trained
classifier, loads the model-selected document on the backend, and returns its
contents rather than only an intent label. CloudflareOS receives no independent
read/search/list access to those area documents. The base skill directs it to
use the tool; backend resource access enforces the document boundary. Wisp's
chat connection stays unchanged.

The [draft design](intent-classifier/design.md) records the assignment excerpt,
context boundaries, model/data proposals, and the routing flow. It replaces the
earlier optional-hint-only proposal. The routing result must affect the selected
workflow; keep evidence from question through prediction and context to the
actual data/RAG operation. Document loading is not a substitute for RAG. The
same public tool can perform the agreed vector retrieval internally for flows
that need sourced knowledge, returning source passages and references alongside
the selected workflow context. Exact retrieval conditions remain to be defined.

Indonesian-only coverage and assistant-authored working guidance are agreed.
Mixed/unclear requests, failure behavior, backend storage details, and the exact
model/tool contract remain open. The routing architecture is agreed and does not
need to be reopened for routine implementation choices. The user has not
authorized application implementation yet.

## Dashboard filters: agreed

The user approved the proposed financial filters. Keep the existing dashboard
structure. Default to This month and All rooms; offer Last month, Last three
months, and a custom date range, plus selection of one room. Financial totals
and charts use the same effective filters. The tenant assessment retains its
independent rolling 12-month window, shown clearly to the owner.

The [dashboard design](dashboard/design.md) contains this approved revision.
Its implementation status is Needs update. This discussion changed documents,
not dashboard code or live behavior.

## Work and decisions still open

The user asked us to handle the remaining tenant-assessment details and write the
recommendations for later review rather than discuss each technical choice.
The [tenant assessment design](room-detector/design.md) collects the proposals for
data, costs, feature formulas, coverage, evaluation, storage, access, serving,
refresh, and failure behavior. Its [delivery plan](room-detector/implementation-plan.md)
records the work order and proof. Both remain Draft; previously approved
decisions retain approval. No detector implementation has started.

| Area | Remaining work or discussion |
|---|---|
| Anomaly model and grades | Use the approved tenant association, cross-room history, measurements, eligibility rules, Isolation Forest approach, A–C scale, and automatic 12-month window. Review the draft formulas, storage, serving, and evaluation details. Current room-cost rankings are not model predictions. |
| Model comparison | The formal plan specifies baseline, feature engineering with baseline parameters, then tuning on the engineered features. Use the same data split and metrics. Select with validation data, then report precision, recall, and F1 on a separate labelled test set. Detailed design is still open. |
| Intent classifier | Use the approved context-tool routing architecture and Indonesian-only scope. Finalize labels, dataset, model, ambiguous/mixed-question behavior, and service failures. Report class counts, imbalance handling, macro-F1, confusion matrix, and routing/error examples. |
| Dashboard | Implement the approved period/room filters and tenant-grade presentation in the dashboard design. Current cash charts remain fixed to this month. DS findings and recommendations still need analysis; financial-list filters already exist. |
| DS analysis | Prepare cleaning and analysis notebooks for pending activities, income/expense changes, and rooms needing attention. Check results against source records. |
| Dataset | Build the selected coherent synthetic tenant and room histories for the combined model; check public-source fit for other models. Prepare the feature contract, dictionary, notebooks, and separate evaluation data. Candidate inspection evidence is saved locally; no training records or trained model are built. |
| Production scheduling | Choose and connect the job execution path for existing recurring generation and notifications. Decide failure recovery and notification catch-up behavior. |
| Live verification | Complete receipt upload/provider proof, app flow checks, access checks, recurrence and cash checks, model/tool integration, and the iPhone PWA flow. Reuse credible existing results. |
| Hosting and setup | Follow the external-services-first policy and VPS fallback above. Confirm placement and operation of the app, database, file storage, model services, scheduled jobs, and Wisp connection. The user owns CloudflareOS access and account setup. Configuration files alone do not prove deployment. |
| Documentation | Revise the formal model scope from maintenance-only to the agreed tenant-associated assessment. Finish or confirm mockups, API contract, interactive API documentation, project-specific README, Project Brief, schema, test record, usage PDF, slides, and presentation video. OpenAPI JSON exists; interactive docs were not found in the review. |
| Owner trial | Arrange a trial of the main flow and record confusing parts. Demo uses sample data; real operational use and real data permissions need a separate agreement. |
| Optional work | Occupant problem reports and owner-only WhatsApp reminders remain last. Neither was added to the initial notification scope. |
| One-off scheduling | Separate proposal only. No approved change to the current completed/settled manual-create flow. |

Intent classification and RAG are marked additional in the formal plan but are
also listed in final deliverables. The proposed priority is to treat them as
post-MVP commitments, above WhatsApp and occupant reports. This was a planning
recommendation; it has not changed the formal MVP/additional classification.

## Proposed work order

This order was suggested during discussion. It is not an implementation command
or a new delivery schedule.

1. Finish the remaining notification details and production scheduling choice.
2. Build and check the recurring activity, inbox, push, work, payment, and receipt
   flow on the owner's iPhone.
3. Prepare representative sample data and finish dashboard filters and analysis.
4. Build and evaluate the anomaly model, then connect saved predictions and
   grades to the app.
5. Connect Pi to application tools and saved history when CloudflareOS is ready.
6. Add intent classification and the agreed RAG pipeline. They can be developed
   independently; retrieval does not require the classifier first.
7. Complete the owner trial, full integration checks, and submission materials.
   Keep setup and documentation current throughout.
8. Consider WhatsApp and occupant reports if time remains.

The formal plan targets MVP on 3 December, combined integration on 10 December,
final checks/materials by 17 December, and submission by 20 December 2026 at
23:59 WIB. We have not replaced those dates with a new estimate.

The detector direction, synthetic dataset approach, initial measurements and
eligibility rules, scoring approach, grade meaning, history window, refresh
policy, presentation locations, and financial dashboard filters are settled.
Intent routing, Indonesian-only scope, and content authoring are
also agreed. Remaining model/data contracts, classifier edge behavior, DS
analysis, deployment details, and delivery proof are listed above. The category
seed is complete under the user's specific authorization. Other application
implementation remains pending separate authorization.
