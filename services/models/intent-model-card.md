# Indonesian intent classifier

The classifier routes one complete question to rooms, schedules, finances,
guidance, or out-of-scope. The app loads the corresponding private workflow
only after an accepted domain prediction. It asks for clarification otherwise.
Mixed requests must be split before routing. This is a single-label model.

## Dataset and comparison

The dataset has 1,000 synthetic Indonesian examples. Each class has 140 training,
30 validation, and 30 test examples. Whole template families remain in one split.
Five object substitutions within a template are correlated. Names and facts
are illustrative query language, not live app records. The first smaller
vocabulary report is retained in evaluations/intent-v1.json.

Three candidates compare word TF-IDF and logistic regression with word plus
character TF-IDF at C=1 and C=4. Validation macro-F1 selects word-char.
Separate validation probes for incomplete questions select confidence and margin
cutoffs. The earlier threshold report is retained in evaluations/intent-v2.json.
The final class test partition does not select the parameters or thresholds.

## Results and limits

Test macro-F1 is 0.8326. The calibrated route accepts
50.67% of test examples, with accepted accuracy
100.00%. The confidence cutoff is
0.65 and the margin cutoff is 0.
This trades coverage for fewer wrong routes. The remaining questions need
clarification. Perfect accuracy on this accepted synthetic subset does not
establish perfect real-user routing.

The report includes all-class metrics, confusion matrices, and errors, including
wrong guidance and out-of-scope predictions. Shared generation patterns limit
generalization. Live source routing was also checked through the app's MCP
endpoint with the real local model. CloudflareOS generation still needs a
chat-ready workspace, remote tools, and deployment setup.

## Runtime

The private Python service loads the trusted joblib artifact after checksum and
sklearn version checks. Its route is POST /intent/classify. The app sends only
the question, not a caller-selected intent or document path. A score is not an
authorization decision. The MCP read tool separately checks the current owner's
app permissions. Private context documents are not MCP resources or web assets.

Accepted test counts by true class are Rooms 10/30, Schedules 22/30,
Finances 24/30, Guidance 10/30, and Out of scope 10/30. These differences show
where clarification is more frequent. All five classes can produce accepted
routes, but the model is conservative for rooms and guidance.
