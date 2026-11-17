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
