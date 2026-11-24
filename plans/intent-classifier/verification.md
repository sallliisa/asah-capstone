# Intent and routing verification

17 November 2026. Implementation is in progress until deployed native chat proof.

The grouped Indonesian dataset has 1,000 examples across five balanced classes.
Each class has 140 training, 30 validation, and 30 test examples. Whole templates
stay in one split. Word TF-IDF/logistic regression was compared with word plus
character features at C=1 and C=4. Word plus character features at C=1 were
selected by validation macro-F1. The first limited-vocabulary report and earlier
threshold report remain in services/models/evaluations.

Test macro-F1 is 0.8326. Incomplete-question validation probes led to a 0.65
confidence cutoff and zero margin cutoff. This accepts 50.67% of test examples;
all accepted routes were correct within this synthetic test subset. The report
retains the other errors. Correlated object substitutions and shared generation
patterns limit generalization. These results do not establish real-user accuracy.
The notebook executed. Ruff and the four existing feature tests passed.

The real local Python HTTP service and app MCP endpoint were connected without
model mocks. A financial question returned the Finances workflow from model
intent-v3-9e81e53d0fdd, then the authorized app read returned calculated cash.
Retrieval reported not-indexed. An incomplete question returned uncertain.
No private credential was printed. Classification results, document contents,
source versions, retrieval state, and event identity are now retained in the
owner's routing audit. Native conversation history remains in CloudflareOS.

Two context route tests use the real MCP client/server, app authorization, and
database. They prove model-selected private document access, rejection of a
caller-selected document, current read permissions, rejection of app writes,
retained routing evidence, and no document for uncertain questions. The RAG
case proves active-version and permitted-area filtering even when the external
vector provider returns candidate or wrong-area matches. Only model/provider
boundaries are mocked. Existing cash and detector regression tests also passed.

API, SDK, and web type checks passed. API and web production builds passed,
with existing large web chunk and plugin-time warnings. Focused lint passed.
The web build scan checked 186 files and found no configured server secrets or
private workflow headings. The private documents are not public assets or MCP
resources. Backend-only Markdown is compiled into the API's generated bundle.

The shared CloudflareOS account has no workspace at the last live check.
Native answer generation, conversation reopening, resource grants, actual
classifier-driven native tool use, and citations remain unverified. The owner
was asked to prepare the workspace/model. VPS deployment is also pending.

## Local v4 comparison

24 November 2026. The same 114 frozen Indonesian questions went through the
protected model route for both versions. The test verified all responses.

- Correct Rooms routes increased from 6 to 12 of 30.
- Correct Guidance routes increased from 0 to 8 of 30.
- Wrong workflow routes fell from 8 to 1. The one remaining route also failed
  in v3.
- All 16 ambiguous questions returned uncertainty, compared with 15 in v3.
  Explicit out-of-scope results increased from 0 to 6 of 14.
- The original 150 grouped test questions had zero wrong accepted results in
  both versions. Acceptance increased from 76 to 82. Finances acceptance fell
  from 24 to 21 of 30 on the grouped test. On the fresh test it increased from
  4 to 6 of 12.

Two local training runs wrote identical reports and returned identical
predictions for the 114 questions. Artifact bytes differed between runs.
Each checksum identifies its own artifact. The service loads v4 at the
existing artifact path with the checksum from its build. The notebook
executed, the four existing Python tests passed, and Ruff passed for the
classifier.

The [model card](../../services/models/intent-model-card.md) records training
data, checks, and limits. The fresh test is synthetic. These results cover
the local model route.
