import hashlib
import itertools
import json

import joblib
import numpy as np
import sklearn
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from kos_models.features import BASELINE_NAMES, FEATURE_NAMES, FEATURE_VERSION
from kos_models.generate import DATA, ROOT, SEED

ARTIFACTS = ROOT / "artifacts"
LABELS = ["A", "B", "C"]


def matrix(rows, names, field):
    return np.array([[row[field][name] for name in names] for row in rows])


def calibrate(scores, labels):
    truth = np.array([LABELS.index(label) for label in labels])
    cuts = np.unique(np.quantile(scores, np.linspace(0, 1, 81)))
    best = None
    for low, high in itertools.combinations(cuts, 2):
        predicted = np.where(scores < low, 0, np.where(scores < high, 1, 2))
        counts = np.bincount(truth * 3 + predicted, minlength=9).reshape(3, 3)
        diagonal = counts.diagonal()
        denominator = counts.sum(axis=0) + counts.sum(axis=1)
        macro = np.divide(
            2 * diagonal, denominator, out=np.zeros(3), where=denominator != 0
        ).mean()
        c_recall = counts[2, 2] / max(1, counts[2].sum())
        key = (macro, c_recall)
        if best is None or key > best[0]:
            best = (key, float(low), float(high))
    return best


def grades(scores, boundaries):
    return np.where(
        scores < boundaries[0], "A", np.where(scores < boundaries[1], "B", "C")
    )


def metrics(rows, predicted):
    truth = [row["label"] for row in rows]
    positive = [label != "A" for label in truth]
    detected = predicted != "A"
    ordinary = np.array(truth) == "A"
    return {
        "macroF1": f1_score(
            truth, predicted, labels=LABELS, average="macro", zero_division=0
        ),
        "binaryPrecision": precision_score(positive, detected, zero_division=0),
        "binaryRecall": recall_score(positive, detected, zero_division=0),
        "binaryF1": f1_score(positive, detected, zero_division=0),
        "ordinaryFalsePositiveRate": float(detected[ordinary].mean())
        if ordinary.any()
        else None,
        "perGrade": classification_report(
            truth, predicted, labels=LABELS, output_dict=True, zero_division=0
        ),
        "confusionMatrix": confusion_matrix(truth, predicted, labels=LABELS).tolist(),
        "examples": [
            {
                "tenantId": row["tenantId"],
                "asOfDate": row["asOfDate"],
                "expected": row["label"],
                "predicted": str(prediction),
                "family": row["family"],
            }
            for row, prediction in zip(rows, predicted)
            if row["label"] != prediction
        ][:20],
    }


def train():
    ARTIFACTS.mkdir(exist_ok=True)
    manifest = json.loads((DATA / "manifest.json").read_text())
    rows = [
        json.loads(line) for line in (DATA / "snapshots.jsonl").read_text().splitlines()
    ]
    subsets = {
        split: [r for r in rows if r["split"] == split and not r["eligibilityReasons"]]
        for split in ("train", "validation", "test")
    }
    groups = {
        split: {r["generationGroup"] for r in rows if r["split"] == split}
        for split in subsets
    }
    if any(groups[a] & groups[b] for a, b in itertools.combinations(groups, 2)):
        raise ValueError("Related generation groups cross splits")
    candidates = [
        ("baseline", BASELINE_NAMES, "baseline", 100, "auto", 1.0),
        ("engineered", FEATURE_NAMES, "features", 100, "auto", 1.0),
    ]
    candidates += [
        (
            f"tuned-{trees}-{samples}-{fraction}",
            FEATURE_NAMES,
            "features",
            trees,
            samples,
            fraction,
        )
        for trees, samples, fraction in itertools.product(
            (100, 200), (128, 256, 512), (0.75, 1.0)
        )
    ]
    comparisons = []
    fitted = []
    for name, names, field, trees, samples, fraction in candidates:
        model = IsolationForest(
            n_estimators=trees,
            max_samples=samples,
            max_features=fraction,
            contamination="auto",
            random_state=SEED,
            n_jobs=1,
        )
        model.fit(matrix(subsets["train"], names, field))
        validation_scores = -model.score_samples(
            matrix(subsets["validation"], names, field)
        )
        selected = calibrate(
            validation_scores, [r["label"] for r in subsets["validation"]]
        )
        boundaries = [selected[1], selected[2]]
        size = sum(tree.tree_.node_count for tree in model.estimators_)
        report = {
            "name": name,
            "featureNames": names,
            "parameters": {"trees": trees, "samples": samples, "fraction": fraction},
            "boundaries": boundaries,
            "treeNodes": size,
            "validation": metrics(
                subsets["validation"], grades(validation_scores, boundaries)
            ),
        }
        comparisons.append(report)
        fitted.append((model, field, names))
        print(
            json.dumps(
                {
                    "name": name,
                    "validationMacroF1": selected[0][0],
                    "validationCRecall": selected[0][1],
                }
            ),
            flush=True,
        )
    eligible = [i for i, item in enumerate(comparisons) if item["name"] != "baseline"]
    winner = max(
        eligible,
        key=lambda i: (
            comparisons[i]["validation"]["macroF1"],
            comparisons[i]["validation"]["perGrade"]["C"]["recall"],
            -comparisons[i]["treeNodes"],
        ),
    )
    model, field, names = fitted[winner]
    chosen = comparisons[winner]
    evaluation = metrics(
        subsets["test"],
        grades(
            -model.score_samples(matrix(subsets["test"], names, field)),
            chosen["boundaries"],
        ),
    )
    version = "tenant-if-v1-" + manifest["sha256"]["snapshots.jsonl"][:12]
    artifact = {
        "model": model,
        "modelVersion": version,
        "featureVersion": FEATURE_VERSION,
        "featureNames": list(names),
        "boundaries": chosen["boundaries"],
        "sklearnVersion": sklearn.__version__,
        "dataset": manifest,
    }
    path = ARTIFACTS / "tenant-detector.joblib"
    joblib.dump(artifact, path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    (ARTIFACTS / "tenant-detector.sha256").write_text(digest + "\n")
    report = {
        "modelVersion": version,
        "artifactSha256": digest,
        "selected": chosen["name"],
        "selection": "Validation macro-F1, then C recall, then tree node count. Test rows excluded from selection.",
        "dataset": manifest,
        "eligibleCounts": {key: len(values) for key, values in subsets.items()},
        "ineligibleCount": sum(bool(r["eligibilityReasons"]) for r in rows),
        "experiments": comparisons,
        "test": evaluation,
        "targetsMet": {
            "binaryF1": evaluation["binaryF1"] >= 0.8,
            "CRecall": evaluation["perGrade"]["C"]["recall"] >= 0.85,
            "ordinaryFalsePositiveRate": evaluation["ordinaryFalsePositiveRate"] <= 0.1,
        },
    }
    (ARTIFACTS / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    (ROOT / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    report = train()
    print(
        json.dumps(
            {
                "selected": report["selected"],
                "test": report["test"],
                "targetsMet": report["targetsMet"],
            },
            indent=2,
        )
    )
