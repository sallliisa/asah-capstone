# Knowledge and routing sources

workflows contains the four private context documents selected by the trained
classifier. agent-skills contains the small base skill to install in CloudflareOS.
guides contains editable Indonesian source passages. Only guides are embedded.
Working policies are authoritative until the owner edits them; current app facts
always come from authorized app reads.

knowledge:build generates the private TypeScript document bundle. The normal
route build and compile run this step. Edit Markdown sources, then rebuild;
do not edit workflows.generated.ts. The generated bundle stays in the API.
It is not a public asset or an MCP resource.

## Index and activate

Configure the API's Cloudflare account ID, token, and Vectorize index name.
Run pnpm --filter @southneuhof/api knowledge:ingest. It probes BGE-M3's actual
embedding shape, checks/creates a compatible index and metadata filters, and
queues stable vectors. Documents and passages stay in the app database. Shared
operating guidance is permitted alongside each routed area. Source versions
and area filters prevent queries from mixing inactive corpora.

The command prints the candidate version ID. Wait until Vectorize mutations
are visible, then run pnpm --filter @southneuhof/api knowledge:verify VERSION.
It selects a similarity cutoff from validation examples and reports separate
test retrieval results. It writes evidence under .local/verification/rag.
No default arbitrary cutoff is used. Native answer generation is a separate
check from passage retrieval.

Passages follow paragraph boundaries within each source section. BGE-M3 vector
search supplies up to 16 candidates. A fixed vector/BM25 blend selects one
passage; a hosted BGE reranker scores that passage. Both score cutoffs are
calibrated from validation examples. Select the strongest support cutoff that
still meets the precision, recall, and unsupported-answer limits. A separate
held-out test gates activation. Reviewed alternative sources are accepted only
where their text supports the same fact. The sources remain in Indonesian.

The initial activation check requires precision at least 0.90 and answerable
recall at least 0.75 on validation and test, with no accepted unsupported test
question. This small authored set is a technical gate, not real-world accuracy.
Inspect its passages and errors. If it fails, keep the previous corpus active;
revise from validation evidence and use fresh test cases for a test-informed
change. Do not lower the gate just to publish.

To activate a passing candidate, run pnpm --filter @southneuhof/api
knowledge:activate VERSION. It requires the saved passing report and matching
verified database scores/model metadata. It does not repeat provider calls.
Activation retires the old version in one transaction. A failed ingestion or
verification does not replace it. Published versions retain their passages and
source hashes. To queue removal of retired vectors, run knowledge:cleanup VERSION.
The cleanup rejects active versions and retains database passages for evidence.

## Tool boundary

getQuestionContext accepts only a question. The model selects a fixed private
context. Uncertain and out-of-scope results return no private document. Successful
routing can continue with live reads when RAG is unavailable, if guidance is not
needed. Pi cites returned passage titles, sections, and versions for guidance.

readAppData accepts a typed read request. It checks the configured active owner's
current app permissions on each MCP request. It reuses the app's cash and tenant
projections. The remote endpoint supports no app write, arbitrary SQL, document
path, resource listing, or direct document retrieval operation.
