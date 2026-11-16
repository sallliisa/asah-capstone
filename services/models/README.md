# Kos model service

Use Python 3.11 and uv. The lock file pins the environment. Training stays
outside app startup and uses one CPU thread.

```sh
uv sync --frozen
uv run pytest
uv run kos-generate
uv run kos-train
```

Run these commands from services/models. Generated data and model files stay in
ignored data and artifacts directories. The committed generator, lock file,
manifest in evaluation.json, and seed reproduce the dataset. No tenant records
from the app are used. The generated snapshots can be large.

The raw histories contain fictional tenants, room links, coverage, event dates,
work state, payment state, and label review evidence. Plans contain the expected
monthly rent occurrences. Snapshots contain compact inputs, eligibility reasons,
features, and separate priority labels. Related room groups remain in one split.
IDs and room names are not features. These labels express synthetic owner review
priorities. They are not evidence of tenant fault or real-world accuracy.

A shared feature calculator serves training and HTTP inference. The notebook
loads its saved experiment report. It does not contain another feature formula.

## Serve

Set MODEL_SERVICE_TOKEN to a private random value of at least 32 characters.
Set TENANT_MODEL_SHA256 to the reviewed artifact digest from
artifacts/tenant-detector.sha256. Set TENANT_MODEL_PATH if the artifact is outside
the default directory. Load only an artifact from our own reviewed training run.
Keep the token out of the browser and use HTTPS between hosts.

```sh
uv run uvicorn kos_models.server:app --host 127.0.0.1 --port 5195 --workers 1
```

GET /health and POST /tenant-detector/score require the bearer token. The score
route accepts featureVersion tenant-v1 and at most 25 tenant inputs. It returns
eligibility, source facts, feature values, model version, abnormality, and grade.
Unknown coverage returns no score. The service has no database credentials.
Limit request size in the deployment reverse proxy. Install this behind HTTPS
before remote use. VPS installation and resource measurements are still pending.

## Evaluation

Read evaluation.json and model-card.md. Parameters and grade boundaries use only
training and validation partitions. Final test rows do not select the artifact.
After a test-informed change, use a new held-out set and retain the old report.
