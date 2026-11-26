# Indonesian intent classifier

The classifier routes one complete question to Rooms, Schedules, Finances,
Guidance, or Out of scope. The app loads the corresponding private workflow
after an accepted domain prediction. It asks for clarification when the
classifier is uncertain. Split mixed requests before routing.

## Training and threshold selection

Train with `uv run kos-train-intent` from `services/models`. The trainer fits
logistic regression with word and character TF-IDF. The model weights each
handwritten training question three times as heavily as a template variant.

The original dataset contains 1,000 synthetic questions in a 700/150/150
split. Each template group stays in one split. The natural dataset adds
248 handwritten training questions and 74 validation questions. It covers
colloquial room and tenant questions, product procedures, and unrelated
questions with words that also occur in Kos workflows.

The validation sets select the confidence cutoff of 0.80 and margin cutoff
of 0. The threshold search requires zero wrong accepted answers on both
validation sets and maintains the previous grouped validation coverage.
The fresh test set contains 114 handwritten prompts. The trainer uses it
only for evaluation.

## Paired test results

Both models answered the same questions through the local
`POST /intent/classify` route.

| Fresh test slice | v3 correct | v4 correct |
| --- | ---: | ---: |
| Rooms | 6 of 30 | 12 of 30 |
| Guidance | 0 of 30 | 8 of 30 |
| Schedules | 6 of 12 | 6 of 12 |
| Finances | 4 of 12 | 6 of 12 |
| Ambiguous, clarification required | 15 of 16 | 16 of 16 |
| Out of scope, explicit rejection | 0 of 14 | 6 of 14 |

Wrong workflow routes fell from eight to one. The remaining error also
occurred with v3. A question about the rules for expense categories routed
to Finances.

On the grouped test, accepted answers increased from 76 to 82 of 150.
Both versions had zero wrong accepted answers. Accepted Finances questions
fell from 24 to 21 of 30 on that test. Macro F1 increased from 0.8326 to
0.9184. The reports and frozen questions are available in
[`intent-evaluation.json`](intent-evaluation.json),
[`evaluations/intent-v3.json`](evaluations/intent-v3.json), and
[`evaluations/intent-fresh-v4.jsonl`](evaluations/intent-fresh-v4.jsonl).
Synthetic questions measure these cases only. Real-user accuracy is unmeasured.

## Runtime

The private Python service checks the artifact checksum and the scikit-learn
version before loading the artifact. The app sends the complete question to
`POST /intent/classify`. The MCP read tool checks the owner's app permissions
before returning workflow data. Retrieval of supporting passages has a
separate evaluation.
