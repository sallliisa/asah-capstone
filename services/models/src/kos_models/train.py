import hashlib
import json

import joblib
import sklearn
from sklearn.ensemble import HistGradientBoostingClassifier
from threadpoolctl import threadpool_limits

from kos_models.features import FEATURE_VERSION
from kos_models.generate import DATA, ROOT
from kos_models.tenant_model import LABELS, MODEL_FEATURE_NAMES, feature_matrix

ARTIFACTS = ROOT / "artifacts"


def train():
    evaluation = json.loads((ROOT / "evaluation.json").read_text())
    snapshots = DATA / "snapshots.jsonl"
    with snapshots.open("rb") as source:
        digest = hashlib.file_digest(source, "sha256").hexdigest()
    if digest != evaluation["dataset"]["sha256"][snapshots.name]:
        raise ValueError("Snapshots do not match the reviewed training dataset")
    if evaluation["featureNames"] != list(MODEL_FEATURE_NAMES):
        raise ValueError("Training features do not match the reviewed model")

    records = []
    labels = []
    with snapshots.open() as source:
        for line in source:
            row = json.loads(line)
            if row["split"] == "train" and not row["eligibilityReasons"]:
                records.append(
                    {"features": row["features"], "baseline": row["baseline"]}
                )
                labels.append(LABELS.index(row["label"]))
    if len(records) != evaluation["fittedRows"]:
        raise ValueError("Eligible training count does not match the reviewed model")

    model = HistGradientBoostingClassifier(**evaluation["parameters"])
    with threadpool_limits(limits=1):
        model.fit(feature_matrix(records), labels)
    artifact = {
        "model": model,
        "modelVersion": evaluation["modelVersion"],
        "featureVersion": FEATURE_VERSION,
        "featureNames": list(MODEL_FEATURE_NAMES),
        "boundaries": evaluation["boundaries"],
        "sklearnVersion": sklearn.__version__,
        "dataset": evaluation["dataset"],
    }
    ARTIFACTS.mkdir(exist_ok=True)
    path = ARTIFACTS / "tenant-detector.joblib"
    joblib.dump(artifact, path)
    artifact_digest = hashlib.sha256(path.read_bytes()).hexdigest()
    (ARTIFACTS / "tenant-detector.sha256").write_text(artifact_digest + "\n")
    report = {
        **evaluation,
        "artifactSha256": artifact_digest,
        "sklearnVersion": sklearn.__version__,
    }
    (ARTIFACTS / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    report = train()
    print(
        json.dumps(
            {
                "modelVersion": report["modelVersion"],
                "artifactSha256": report["artifactSha256"],
                "fittedRows": report["fittedRows"],
            },
            indent=2,
        )
    )
