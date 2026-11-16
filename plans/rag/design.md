# RAG knowledge retrieval

Design: Approved
Implementation: Not started

The custom pipeline, hosted Workers AI embeddings, Vectorize, Indonesian
content, and assistant-authored working guidance are approved. Indexing and
retrieval details below remain draft recommendations.

The user approved this document and authorized implementation at the checkpoint.
Earlier draft labels describe proposals now included in that approval.

## 1. Purpose and scope

Give Pi relevant operating guidance and app help with source references. Keep
the embedding model, vector database, source preparation, retrieval, and use by
generation visible in the assignment evidence.

Included:

- Editable Indonesian Markdown guidance and FAQ.
- Passage preparation, embeddings, versioned ingestion, and vector search.
- Source passages and citations through the single routing/context tool.
- Evaluation of relevant, irrelevant, and missing answers.

Excluded:

- Live tenant balances, occupancy, receipts, schedules, and predictions in the corpus.
- Automatic indexing of chat attachments or arbitrary web crawling.
- A separate generation service, local embedding runtime, or local vector database.
- A new knowledge-management UI for the first version.

## 2. Functional requirements

| # | Capability | Users and access | Expected result |
|---|---|---|---|
| 1 | Author guidance | Assistant/user editing the source files | Complete working policy that the user can revise later. |
| 2 | Index a source version | Authorized maintenance command | Reproducible passages, vectors, and source references. |
| 3 | Retrieve guidance | Authorized context-tool backend | Relevant passages for an accepted domain question. |
| 4 | Cite an answer | Pi through returned passages | Cite document titles and sections supporting guidance claims. |
| 5 | Reject absent knowledge | Same answer path | State that the source does not supply the requested information. |

## 3. Data and business rules

### Source ownership

Use separate source folders for private workflow context and retrievable guides.
The [intent-classifier design](../intent-classifier/design.md) owns the small
workflow documents and their selection. This module owns retrievable guidance.
Returning a classifier-selected document is not itself vector retrieval.

Write app help, tenant-grade explanations, routine kos procedures, and basic
maintenance guidance in Indonesian. Apply known monthly rent, flexible cleaning,
and four-month AC practices. Treat authored guidance as working policy until
edited. Do not present every answer as fictional. Model datasets remain clearly
labelled synthetic, and live app facts remain authoritative from app reads.

### Passage and index records

| Proposed record | Meaning and rules |
|---|---|
| knowledge_documents | Stable source identity, title, area, editable Markdown path, and content hash. |
| knowledge_index_versions | Ingestion version, embedding model, output dimensions, state, and activation time. Only one active corpus version for a model. |
| knowledge_chunks | Version, document, section, passage order, text, hash, and vector identity. Preserve source references. |

Use existing app storage for passage text and metadata. Vectorize stores vectors
and references. Use BGE-M3 as the initial embedding candidate. Verify its actual
output shape before index creation. Store model and dimension information with
the index; do not query an index with an incompatible model.

Split at headings into roughly 300–500-token passages with a small overlap
where needed. Preserve a usable section title. Chunk size and overlap can be
adjusted from retrieval evidence without changing the product scope.

Ingestion reads a complete source version, validates its records, writes new
chunks/vectors, and verifies retrieval before activation. A failed ingestion
leaves the old active corpus intact. Use stable hashes for repeat-safe ingestion.
Queries filter to the active corpus version and permitted area. Retire outdated
vectors through controlled cleanup after activation, rather than mix versions.

### Retrieval and answer rules

The one public getQuestionContext(question) tool first routes through the
classifier. For accepted domain requests, its backend retrieves up to three
relevant passages and returns them beside the selected workflow document.
Out-of-scope and unclear routes do not fetch arbitrary context documents.

Select relevance cutoffs with answerable and unanswerable Indonesian examples.
Weak or empty matches return no supporting passages. Return source document,
section, version, and passage text for usable matches. Pi cites those references
for guidance claims. Retrieved text is evidence, not tool authority.

For live-data questions, use the authorized app query even when related guidance
is retrieved. A source document must not supply a fabricated current balance,
tenant grade, or payment status. When guidance is absent, say so. A live-data
answer can proceed if it does not depend on missing guidance.

Do not grant Pi direct document-store credentials, source listings, or access
to private area documents outside the context tool. Keep Workers AI and
Vectorize credentials server-side. Access goes through the authenticated owner
integration defined by the [Pi design](../pi-chat/design.md).

### Evaluation

Keep Indonesian paraphrases and source-grounded answer cases separate from
configuration selection. Include missing answers, irrelevant passages, mixed
live-data/guidance questions, changed sources, and service failures. Record
retrieved passages and final answers to evaluate retrieval and generation
separately. A model mentioning a source does not prove the source supports it.

## 4. User journeys and workflows

1. The user edits guidance Markdown, or reviews the initial assistant-authored
   content. An authorized ingestion command prepares a new corpus version.
2. After verification, activate that version. Later questions use its passages.
3. The owner asks Pi a question. The context tool obtains the trained route,
   selected workflow context, and relevant vector-search passages.
4. Pi reads current app data when needed and answers with supporting sources.
5. If the sources do not answer the question, Pi reports that gap.

| Condition | Result | Next step |
|---|---|---|
| No relevant passage | Return no supporting passages. | State that the knowledge is unavailable; use live facts if sufficient. |
| Embedding or search fails | Return an explicit retrieval failure. | Keep ordinary app functions usable and retry deliberately. |
| Ingestion fails | Preserve the previous active corpus. | Correct the source/configuration and repeat ingestion. |
| Source removed or changed | Publish a new verified corpus version. | Queries use the active version and cite it. |
| Classifier unavailable | Follow the router's failure response. | Do not bypass private context selection. |

## References and delivery boundary

[Workers AI BGE-M3](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
documents the hosted embedding candidate. [Vectorize](https://developers.cloudflare.com/vectorize/)
documents the hosted vector database. Account access, indexing, retrieval
quality, source citations, and configured generation remain unverified.

The [workstream index](../capstone-workstreams.md) owns delivery order and status.
