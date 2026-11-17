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
