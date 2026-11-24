import numpy as np

from kos_models.features import FEATURE_NAMES

MODEL_FEATURE_NAMES = (*FEATURE_NAMES, "settledLateCount")
LABELS = ("A", "B", "C")


def feature_matrix(records):
    return np.array(
        [
            [record["features"][name] for name in FEATURE_NAMES]
            + [record["baseline"]["settledLateCount"]]
            for record in records
        ],
        dtype=float,
    )


def score_tenants(artifact, records):
    scores = artifact["model"].predict_proba(feature_matrix(records)) @ np.arange(3)
    low, high = artifact["boundaries"]
    grades = np.take(LABELS, np.searchsorted([low, high], scores, side="right"))
    return scores, grades
