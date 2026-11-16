# Intent classifier for Pi

Design: Approved
Implementation: Not started

Routing architecture and Indonesian-only scope: Approved by the user. The full
design remains Draft for mixed-question, uncertainty, and failure behavior.

Pi is read-only for the first version, explicitly approved by the user. Routed
workflows may query authorized records or retrieve guidance. They do not write
activities, payments, assignments, or reminders. The
[final review](../capstone-final-review.md) proposes defaults for the remaining
labels, mixed-question handling, follow-ups, retrieval, and service failures.

The user approved this document and authorized implementation at the checkpoint.
Earlier draft labels describe proposals now included in that approval.

## 1. Purpose and scope

Route the owner's question to an area-specific context document using a trained
intent classifier. Pi means CloudflareOS. Wisp provides the chat connection.
The user selected one routing/context tool plus a base agent skill. Keep the
area-specific documents private to the backend. The model selects the context
used for the next workflow, and the tool returns that document's contents.

The user supplied this assignment requirement:

> Hasil klasifikasi dipakai untuk mengarahkan pertanyaan ke alur yang sesuai,
> misalnya pertanyaan produk dijawab oleh sistem RAG dan keluhan diteruskan ke
> pemilik usaha.

Passive chat monitoring does not meet that requirement. The earlier proposal
of a label used only as an optional hint is replaced by model-selected context
with observable workflow effects. A selected document must lead to the intended
application-data, schedule, financial, or RAG flow; merely displaying a label or
document title is not the intended result.

The formal plan requires at least four intents, class-count/imbalance review,
macro-F1, a confusion matrix, error examples, and integration with Pi's choice of
tools or sources. Synthetic examples are allowed. Access and the shared
CloudflareOS account are owned by the user.

The user approved the routing-tool/context-document architecture, including
backend-only area documents, classifier-selected document contents in the tool
response, and internal RAG retrieval when needed. Keep that decision settled
while resolving the remaining behavior. No training or implementation is
authorized by this discussion.

## 2. Functional requirements

| Capability | Proposed result |
|---|---|
| Route a question | Call the trained model, map its predicted intent to a permitted context document, and return the selected document contents. A label alone is not the output. |
| Load context through the tool | The agent has no independent read/search/list access to the area-specific document store. Only the base routing skill is supplied directly to CloudflareOS. |
| Support the app's scope | Cover room information/maintenance, schedules, finances, and guidance. |
| Use the route | The agent follows the returned context to the appropriate data or RAG workflow. Its base skill explains when to call the router, without replacing the model with its own intent-to-document choice. |
| Handle uncertainty | Ask a focused question when the request cannot be resolved from context. Select thresholds from validation results. |
| Handle mixed questions | Define a policy for several requested results. One candidate is to split the request and route each part through the same tool. A single-label model must not be presented as a trained multi-label model. |
| Handle unrelated questions | Include out-of-scope examples and evaluate rejection behavior. The classifier is not the sole domain guard or an authorization boundary. |
| Service failure | Keep the main app usable. Report routing failure clearly. Any fallback is distinct from successful model routing and must not be counted as such in evaluation. Exact fallback behavior remains open. |

## 3. Data and business rules

### Proposed context documents and intent boundaries

Classify by the requested result, not just a word such as AC or rent. Give each
domain document its instructions, relevant application terms, source/tool
references, and expected answer behavior. Keep live room and financial values
in application queries rather than embedding them into static context.

| Context / intent | Examples | Resulting workflow |
|---|---|---|
| Rooms, tenants, and maintenance | Which rooms are empty? Which tenant needs attention first? What repairs are associated with this tenant? | Read room/tenant records, historical activity associations, or saved tenant grades. |
| Schedules | When is room 12's next AC service? What work is due today? | Read recurring plans, activity dates, or notifications. |
| Finances | How much was spent on repairs this month? Which recorded rent payments are overdue? | Run authorized financial queries and report their results. |
| Guidance | How do I record payment? What does grade C mean? What should I check when an AC leaks? | Use the context tool's internal RAG retrieval for relevant app help, FAQ, or guide passages, then cite the returned sources. |
| Out of scope | Requests unrelated to operating the kos or using the app. | A bounded domain response. |

The last label is an extra class beyond the four required domain intents.
Ambiguous and mixed requests need distinct evaluation cases; they are not
automatically out of scope. The exact label set and behavior await approval.

### Context access and retrieval

Give CloudflareOS a base skill that instructs it to obtain domain context through
the tool and follow the returned instructions. Keep the area documents in one
backend-controlled store. Do not publish them as agent-readable Context Library
documents, add them to the base prompt, or grant the agent independent store
credentials. The agent can read the selected contents in the tool response,
but cannot fetch the source documents itself.

The proposed public tool name is `getQuestionContext(question)`. The caller
supplies the question, not a desired intent or document path. The backend owns
classification, document selection, and loading. Return the full small routing
document; keep document identity/version and model results available for the
routing evidence.

Workflow context and RAG source passages have different purposes. A direct
classifier-to-document lookup is routing, not vector retrieval. The same public
tool can also perform the agreed Workers AI/Vectorize search when the selected
flow needs sourced knowledge, and return the supporting passages and references
beside the routing document. This combines routing and RAG behind one context
tool without requiring direct document reads by the agent. Exact retrieval
conditions and the response structure remain draft details.

Application-data flows still need authorized live queries; their values are not
stored in these static context documents. Retrieved FAQ text remains evidence,
separate from the tool's authored workflow instructions.

### Content authoring decision

The user authorizes the assistant to write complete context documents and RAG
guidance using reasonable operating assumptions. Use these documents as the
app's current working policy until the user edits them. Write usable content
directly, rather than placeholders or material described to Pi as fictional.
Pi should apply that guidance normally without repeatedly qualifying it as an
assumption.

Keep the editable Markdown source authoritative. Record this authoring decision
here for review; it does not require assumption labels on each answer. This
permission concerns operating guidance, not fabricated live room, payment,
schedule, or prediction records. Those values still come from application tools.
It also does not change the requirement to document synthetic model datasets.

### Dataset and model proposal

Support Indonesian only for the classifier and initial authored context/RAG
content. This reduces the language coverage needed in data preparation and
evaluation; it is not a guarantee of better accuracy. Prepare labelled questions
with formal and informal Indonesian wording,
abbreviations, misspellings, and overlapping vocabulary. Include financial
questions about repairs and scheduling questions about cleaning to prevent
simple keyword shortcuts. English support is outside the initial scope.

Use separate training, validation, and test sets. Keep close paraphrases and
templates together when splitting. Review class counts and use validation data
to select configuration and uncertainty thresholds. Preserve error examples and
report macro-F1 and confusion matrices on the separate test set.

[MASSIVE](https://huggingface.co/datasets/AmazonScience/massive) includes Indonesian
intent data, but its labels do not directly match ours. Use public examples only
after a fit review. Domain-specific synthetic examples are the proposed base.
No dataset size or trained configuration is selected yet.

Start with a trained TF-IDF and logistic-regression baseline. If its errors
justify another candidate, compare a classifier trained on hosted multilingual
embeddings. Both are proposals; select from evaluation results. Model scores are
not proof that a question is understood or that a requested operation is allowed.
References: [text features](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)
and [logistic regression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html).

## 4. User journeys and workflows

1. The owner sends a question through Wisp to CloudflareOS.
2. A base agent skill instructs it to call the single routing tool when a
   question needs domain routing. Use it for new substantive domain questions;
   rules for continuing a routed conversation remain to be agreed.
3. The tool sends the question to the trained classifier. It owns the fixed
   mapping from model labels to allowed context documents. The agent does not
   supply the desired label or document as the route decision.
4. The tool loads and returns the selected document contents. For a flow needing
   RAG, it also retrieves and returns relevant source passages. Preserve model
   scores and document identity/version for evaluation.
5. CloudflareOS follows that context to execute the appropriate authorized data
   or RAG workflow, then answers the owner.

The one tool here means one public routing/context tool, rather than one tool
per intent. It can call the RAG service internally. The selected workflows still
need their authorized application-data capabilities; it is not a replacement
for those operations.

Wisp talks directly to CloudflareOS. This design operates inside the agent's
tool workflow; no Wisp message-interception hook is assumed. Use CloudflareOS's
skill facilities for the base instructions, and backend storage for the private
area documents. Check the user's deployed version and tool/resource grants
before claiming that the direct-read restriction is established. A prompt
instruction alone is not proof of that access restriction.

Evidence must connect the question, model prediction, selected document, and
the source or operation actually used. Classification metrics alone do not
establish routing. Keep routing examples and failures beside model evaluation
results so the assignment can show the model's effect.

Prefer a suitable hosted service under the agreed hosting policy; the user's
2 vCPU / 8 GB VPS is the fallback for custom classifier serving. Exact serving,
invocation, backend storage, mixed-question handling, and failure behavior
remain open. The interface adds no new app-account workflow.
