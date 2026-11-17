import hashlib
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

import joblib
import numpy as np
import sklearn
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from kos_models.features import FEATURE_NAMES, FEATURE_VERSION, TenantInput, calculate


@asynccontextmanager
async def lifespan(app: FastAPI):
    path = Path(os.environ.get("TENANT_MODEL_PATH", "artifacts/tenant-detector.joblib"))
    token = os.environ.get("MODEL_SERVICE_TOKEN", "")
    expected = os.environ.get("TENANT_MODEL_SHA256", "")
    if not token or len(token) < 32:
        raise RuntimeError("MODEL_SERVICE_TOKEN must contain at least 32 characters")
    if not expected or not secrets.compare_digest(
        hashlib.sha256(path.read_bytes()).hexdigest(), expected
    ):
        raise RuntimeError("TENANT_MODEL_SHA256 does not match the trusted artifact")
    artifact = joblib.load(path)
    if (
        artifact["featureVersion"] != FEATURE_VERSION
        or artifact["featureNames"] != list(FEATURE_NAMES)
        or artifact["sklearnVersion"] != sklearn.__version__
    ):
        raise RuntimeError("Model and serving environment are incompatible")
    app.state.artifact = artifact
    app.state.intent = None
    intent_path = os.environ.get("INTENT_MODEL_PATH")
    intent_hash = os.environ.get("INTENT_MODEL_SHA256", "")
    if intent_path:
        intent_file = Path(intent_path)
        if not intent_hash or not secrets.compare_digest(
            hashlib.sha256(intent_file.read_bytes()).hexdigest(), intent_hash
        ):
            raise RuntimeError(
                "INTENT_MODEL_SHA256 does not match the trusted artifact"
            )
        app.state.intent = joblib.load(intent_file)
        if app.state.intent.get("sklearnVersion") != sklearn.__version__:
            raise RuntimeError("Intent model and serving environment are incompatible")
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
        "ready": True,
        "modelVersion": artifact["modelVersion"],
        "featureVersion": FEATURE_VERSION,
        "intentReady": app.state.intent is not None,
    }


@app.post("/tenant-detector/score", dependencies=[Depends(authorize)])
def score(batch: ScoreBatch):
    if batch.featureVersion != FEATURE_VERSION:
        raise HTTPException(status_code=422, detail="Unsupported feature version")
    artifact = app.state.artifact
    results = []
    for tenant in batch.tenants:
        result = calculate(tenant)
        result.update(modelVersion=artifact["modelVersion"], score=None, grade=None)
        if not result["eligibilityReasons"]:
            features = np.array([[result["features"][name] for name in FEATURE_NAMES]])
            abnormality = float(-artifact["model"].score_samples(features)[0])
            low, high = artifact["boundaries"]
            result.update(
                score=abnormality,
                grade="A" if abnormality < low else "B" if abnormality < high else "C",
            )
        result.pop("baseline")
        results.append(result)
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
