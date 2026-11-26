import hashlib
import logging
import os
import secrets
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Annotated

import joblib
import numpy as np
import sklearn
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from kos_models.features import FEATURE_VERSION, TenantInput, calculate
from kos_models.tenant_model import MODEL_FEATURE_NAMES, score_tenants

logger = logging.getLogger(__name__)


def load_artifact(path: str, expected: str, *, tenant: bool = False):
    try:
        content = Path(path).read_bytes()
        if not expected or not secrets.compare_digest(
            hashlib.sha256(content).hexdigest(), expected
        ):
            raise ValueError("Checksum does not match the trusted artifact")
        artifact = joblib.load(BytesIO(content))
        if artifact["sklearnVersion"] != sklearn.__version__:
            raise ValueError("Model and serving environment are incompatible")
        if tenant:
            model = artifact["model"]
            low, high = artifact["boundaries"]
            if (
                artifact["featureVersion"] != FEATURE_VERSION
                or artifact["featureNames"] != list(MODEL_FEATURE_NAMES)
                or model.n_features_in_ != len(MODEL_FEATURE_NAMES)
                or not np.array_equal(model.classes_, np.arange(3))
                or not callable(model.predict_proba)
                or not 0 <= low < high <= 2
            ):
                raise ValueError("Tenant model feature contract is incompatible")
        return artifact
    except Exception:
        logger.exception("Could not load model artifact %s", path)
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    token = os.environ.get("MODEL_SERVICE_TOKEN", "")
    if not token or len(token) < 32:
        raise RuntimeError("MODEL_SERVICE_TOKEN must contain at least 32 characters")
    app.state.artifact = load_artifact(
        os.environ.get("TENANT_MODEL_PATH", "artifacts/tenant-detector.joblib"),
        os.environ.get("TENANT_MODEL_SHA256", ""),
        tenant=True,
    )
    app.state.intent = None
    intent_path = os.environ.get("INTENT_MODEL_PATH")
    if intent_path:
        app.state.intent = load_artifact(
            intent_path, os.environ.get("INTENT_MODEL_SHA256", "")
        )
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


def authorize(authorization: Annotated[str | None, Header()] = None):
    expected = "Bearer " + os.environ.get("MODEL_SERVICE_TOKEN", "")
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


class ScoreBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    featureVersion: str
    tenants: list[TenantInput] = Field(min_length=1, max_length=25)


@app.get("/health", dependencies=[Depends(authorize)])
def health():
    artifact = app.state.artifact
    return {
        "ready": artifact is not None,
        "modelVersion": artifact["modelVersion"] if artifact is not None else None,
        "featureVersion": FEATURE_VERSION,
        "intentReady": app.state.intent is not None,
    }


@app.post("/tenant-detector/score", dependencies=[Depends(authorize)])
def score(batch: ScoreBatch):
    if batch.featureVersion != FEATURE_VERSION:
        raise HTTPException(status_code=422, detail="Unsupported feature version")
    artifact = app.state.artifact
    if artifact is None:
        raise HTTPException(status_code=503, detail="Tenant model is unavailable")
    results = [calculate(tenant) for tenant in batch.tenants]
    eligible = [result for result in results if not result["eligibilityReasons"]]
    for result in results:
        result.update(modelVersion=artifact["modelVersion"], score=None, grade=None)
    if eligible:
        scores, grades = score_tenants(artifact, eligible)
        for result, priority, grade in zip(eligible, scores, grades, strict=True):
            result["features"]["settledLateCount"] = result["baseline"][
                "settledLateCount"
            ]
            result.update(score=float(priority), grade=str(grade))
    for result in results:
        result.pop("baseline")
    return {"results": results}


class IntentQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    question: str = Field(min_length=1, max_length=2000)


@app.post("/intent/classify", dependencies=[Depends(authorize)])
def classify(question: IntentQuestion):
    artifact = app.state.intent
    if artifact is None:
        raise HTTPException(status_code=503, detail="Intent model is unavailable")
    probabilities = artifact["model"].predict_proba([question.question])[0]
    order = np.argsort(probabilities)
    confidence = float(probabilities[order[-1]])
    margin = float(probabilities[order[-1]] - probabilities[order[-2]])
    intent = str(artifact["model"].classes_[order[-1]])
    accepted = (
        confidence >= artifact["confidenceThreshold"]
        and margin >= artifact["marginThreshold"]
    )
    status = (
        ("out-of-scope" if intent == "out-of-scope" else "routed")
        if accepted
        else "uncertain"
    )
    return {
        "status": status,
        "intent": intent if accepted else None,
        "confidence": confidence,
        "margin": margin,
        "modelVersion": artifact["modelVersion"],
    }
