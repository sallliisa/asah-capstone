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
