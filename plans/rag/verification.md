# RAG preparation and verification

17 November 2026. Implementation is in progress.

The API contains editable Indonesian guides, private workflow context, a separate
base skill, passage preparation, BGE-M3 embedding requests, Vectorize metadata
filters and search, source/version records, threshold calibration, activation,
and controlled retired-vector cleanup. Only guides are embedded. Current app
records, receipts, balances, and predictions are not indexed.

Two knowledge migrations and the routing-audit migration were reviewed and
applied to development and the guarded test database. Development had 14
migrations before the last routing-audit migration and one original Activity.
Original business records were preserved. No source corpus has been indexed.

A real app/database test with mocked external embedding/search proves that
candidate-version or wrong-area provider matches cannot enter the returned
passages. It does not establish actual embedding shape, retrieval quality,
Vectorize indexing, or generation. Provider request formats were checked against
the current official Cloudflare API documentation. The ingestion command probes
actual embedding dimensions before index creation. Ingestion does not activate
a corpus. Verification selects a cutoff from validation cases and evaluates a
separate test set before optional atomic activation. Failed preparation leaves
the previous active version intact. Source passages remain in the app database.

Cloudflare account ID and API token were absent at the configuration check.
The owner was asked to add them to the ignored API environment file. Therefore
live ingestion, embedding shape, index creation, query filtering, relevance
calibration, final retrieval metrics, generation, and source support remain
blocked by access. No arbitrary fallback score or fabricated RAG answer is used.

API, SDK, and web checks pass. Evidence is under .local/verification/context-*.
The maintenance commands and initial activation gate are documented in
apps/api/knowledge/README.md. Production service/timer templates are in deploy.

## Live retrieval checkpoint

Workers AI generated real 1,024-dimensional BGE-M3 embeddings. Vectorize
contains four source documents in 16 paragraph passages. Metadata indexes and
active-version/area filtering work on the live provider. Repeat ingestion
failed on the provider's String type spelling before normalization and passes
after the fix. Index mutations become searchable asynchronously; readiness was
checked before evaluation.

Earlier failed candidates and examples are retained in analysis/rag. Paragraph
preparation, best-vector selection, a reranker, question prompts, and hybrid
ranking were evaluated. Question prompts were removed after poor results. The
current original Indonesian sources are unchanged. The final pipeline searches
16 vector candidates, combines vector and BM25 relevance, then obtains a hosted
BGE reranker score for the selected passage. Both relevance and support cutoffs
are calibrated. Select the strongest support cutoff that still meets validation
precision, recall, and rejection limits. This favors refusal over weak support.

The final set contains 166 validation and 32 fresh test questions. Past test
cases informed revisions and became validation cases; each revised final test
was new. Current validation precision is 0.9775, recall 0.7565, unsupported 0.
Test precision is 1.0, recall 0.7917, unsupported 0. The reviewed alternatives
only accept sections that state the same fact. These authored examples do not
establish real-user accuracy. Full questions, errors, scores, and reports remain
in analysis/rag/retrieval-current.json and the earlier reports.

Corpus 4e2e758fcfff33fa021fb23f90888d06e8989c1b21ff7a1e06c0932138ed073b
is active in development. Activation uses the saved passing report and matching
verified database metadata in one locked transaction. It no longer repeats all
provider calls. An attempted full re-evaluation timed out before activation;
the saved verification result remained intact. The activation command is now
knowledge:activate VERSION.

A real app MCP check called the intent model on the VPS through a private SSH
forward. It selected Finances and persisted its routing audit. Runtime retrieval
returned the four-month AC source and rejected an unknown Wi-Fi password.
Evidence is in .local/verification/rag-live-vps-chain.*. Native CloudflareOS
answer routing and citation use still require the deployed MCP connection.

Activation guard proof uses the real command and guarded test database. An
indexed candidate with otherwise matching passing-report fields is rejected
and remains indexed. After verification, the same command publishes it. The
case failed when the database-state guard was disabled, then passed after the
original script was restored. Both context-route cases also pass.

The same real MCP/retrieval proof also passed with the VPS reached through
authenticated HTTPS, after hostname publication. API build/lint, SDK/web types,
and the three selected context/activation tests pass. The development corpus
is active; publication on the deployed app still needs its configured database
and deployment checks.


## Production native answer acceptance

The active corpus is available to the deployed canonical app. Both staged and
public production MCP checks passed with the VPS classifier over authenticated
HTTPS. A real CloudflareOS chat called getQuestionContext and cited the returned
monthly rent passage in Indonesian. The app database contains the resulting
routing audit. The four private workflow documents remain on the app server;
only the base skill is installed in the native Skills collection.

A separate native cash question routed through the classifier and continued
with live app reads when guidance retrieval returned no-match. The answer used
actual settled cash and a record link. Wisp reopened that saved answer. See
../pi-chat/verification.md and ../../deploy/cfos-verification.md. This proves
the generation, embedding, vector retrieval, classifier, and app-read connection;
it does not increase the size or scope of the authored retrieval evaluation.

## Offline comparison, 24 November 2026

On 40 fresh Indonesian questions with known intent, the best lexical candidate
and the lexical baseline each found support for 2 of 28 answerable questions.
Both returned no passages for the 12 unanswerable questions. The candidate
returned one wrong passage on an answerable question.

On archived hosted scores, the tested cutoffs raised supported returns from
19 to 23 of 24 on one corpus snapshot and from 18 to 22 of 24 on another.
Both snapshots used the same archived questions. Precision stayed at 100%
and neither version returned passages for the eight unanswerable questions.

In the offline cascade, intent v4 correctly routed 3 of 13 Guidance questions
with an identified supporting passage. Intent v3 routed none of the 13.
The lexical confidence gate returned no supporting passages in either run.
The archived scores do not contain the embeddings, search results, and
reranker scores for the fresh questions. The active retrieval policy stays
in use pending fresh hosted evidence.

The comparison files are in `.local/retrieval-hillclimb-20261124/`.

## Hosted comparison, 24 November 2026

The same 40 frozen Indonesian questions ran against the configured hosted
corpus of 16 passages. Workers AI and Vectorize supplied the embeddings,
candidates, and reranker scores. Both cutoffs found a supporting passage for
16 of 28 answerable questions. Each returned two wrong passages for answerable
questions and one irrelevant passage for the 12 unanswerable questions.
Precision was 16 of 19. The proposed cutoff gave no gain and failed the
90% precision gate. The active cutoff stays in use.

The cascade paired saved FastAPI predictions for the same 114 questions with
fresh hosted retrieval scores. Intent v4 correctly routed 3 of 13 Guidance
questions with a known supporting passage, compared with zero for v3. Neither
version returned a supporting passage for those questions. Intent v4 still
reduced wrong tool routes from 8 to 1. This is the intent and retrieval
cascade. Native answer generation has a separate check.

Evidence is in `.local/verification/hosted-rag-pi-wisp-20261124/retrieval-report.json`.

## Hosted top-five reranking, 25 November 2026

Two runs used the same 40 questions, active corpus, and score cutoffs. The
control sent the first passage to BGE. The candidate sent the first five,
selected the highest BGE score, and applied the active cutoffs.

Of the seven answerable questions with a wrong first passage, five had a
supporting passage in the first five. The other two had one at rank six.
BGE selected the supporting passage for one of the five. Both active cutoffs
rejected it. The candidate also replaced two correct returns with wrong
passages. Both runs returned 14 of 28 supporting passages with the candidate
and 16 of 28 with the control. Each returned one irrelevant passage for the
12 unanswerable questions. Keep the active policy.

The comparison and per-question scores are in
`.local/verification/hosted-rag-top-five-20261125/`.

## Hosted answer-context comparison, 25 November 2026

Muse Spark 1.3 Contributor answered the same 40 questions with the correct
area and the same workflow context in three conditions. The model received
the current hosted retrieval result, all 16 permitted passages, or only the
fixture's supporting passages. It received no supporting passages in the
third condition when the guide lacked an answer. The replay kept the Pi skill
and supplied a fixed context-tool result. It measured answer generation with
known routing.

Current retrieval produced 20 correct answers, of which 16 cited supporting
passages. Full context and verified context each produced 28 correct answers
with supporting citations. All three conditions declined to invent the
requested details for all 12 questions the guide could not answer.

All 16 hosted passages match the archived guides. The repository's app-help
guide has since added one-off scheduling, lead time for recurring tasks, and
updated notification behavior. The comparison measured answers against the
active guide version. Test multi-passage vector retrieval on fresh questions
using the updated guide, then verify the native Pi path before activation.

Evidence is in `.local/verification/rag-context-assumption-20261125/`.

## Refreshed guide and multi-passage comparison, 25 November 2026

Indexed 17 passages from the current guides as version `7137c724…`. The
initial verification ran before Vectorize exposed the new vectors. The retry
passed the one-passage policy gate with 94.6% precision and 75.7% recall on
validation, and 100% precision and 75% recall on the test split. Neither split
returned a passage for a question without guide support. Activated the
verified version. A fresh database read confirmed that it is active.

In a live Kos De Mansion chat, Pi explained how to set the number of days
before a recurring task is due. It cited the refreshed app-help section and
abbreviated its version in the answer. The routing audit recorded the full
version and supporting passage. The verification chats were removed.

Compared one-passage retrieval with six hybrid-ranked Vectorize matches on
24 fresh Indonesian questions. Both conditions used the refreshed corpus,
the same known routing, and Muse Spark with replayed context-tool results.
The one-passage policy covered 11 of 16 answerable questions. The first three
hybrid matches covered 15, and the first six covered all 16. Pi gave 11 correct
answers with complete guide citations with one passage and 16 with six. Both
conditions declined to invent the requested detail for all eight questions
without guide support.

Six-passage retrieval met the answer-stage criteria. It forwarded passages
for all eight questions without guide support, which fails the existing
retrieval activation requirement. The live service uses the verified
one-passage policy. The six-passage experiment did not exercise native
chat orchestration.

Evidence is in `.local/verification/hosted-rag-multi-passage-20261125/`.
