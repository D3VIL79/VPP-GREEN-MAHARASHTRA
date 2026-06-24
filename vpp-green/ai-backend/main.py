"""
VPP Green Maharashtra -- AI Service Entry-Point
================================================
FastAPI application wiring all 7 TRAINED AI engines:

    1. Tree Health Detection        (ResNet-18 CNN, 99.17% accuracy)
    2. Species Recognition          (ResNet-18 CNN, 83.00% accuracy, 33 classes)
    3. Growth Estimation            (Gradient Boosting, trained on 150 samples)
    4. Carbon Sequestration         (Random Forest + IPCC Formula)
    5. Survival Prediction          (Random Forest, 90% accuracy, 0.97 AUC)
    6. Duplicate Photo Detection    (Perceptual Hashing, 100% accuracy)
    7. GPS Anomaly Detection        (Rules + DBSCAN + Geofence, 100% F1)

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload

Author : VPP AI Team
Version: 2.0.0
"""

from __future__ import annotations

import io
import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Engine routers ───────────────────────────────────────────────────
from engines.tree_health import router as tree_health_router
from engines.species_recognition import router as species_router
from engines.growth_estimation import router as growth_router
from engines.carbon_sequestration import router as carbon_router
from engines.survival_prediction import router as survival_router
from engines.duplicate_detection import router as duplicate_router
from engines.gps_anomaly import router as gps_router

# ── Engine handler functions (for unified dispatcher) ────────────────
from engines.tree_health import (
    _prepare_image as health_prepare,
    _predict as health_predict,
    _compute_analysis_metrics as health_metrics,
    REMEDIES as HEALTH_REMEDIES,
    STATUS_LABELS as HEALTH_STATUS_LABELS,
)
from engines.species_recognition import (
    _prepare_image as species_prepare,
    _predict as species_predict,
    SPECIES_METADATA,
)
from engines.duplicate_detection import (
    _compute_phash,
    _compute_ahash,
    _check_against_store,
    _store_hash,
)
from engines.growth_estimation import estimate_growth, GrowthRequest
from engines.carbon_sequestration import carbon_score, CarbonScoreRequest
from engines.survival_prediction import predict_survival, SurvivalRequest
from engines.gps_anomaly import check_gps_anomaly, GpsAnomalyRequest

logger = logging.getLogger(__name__)

# ── App initialisation ──────────────────────────────────────────────

startup_time = time.time()

app = FastAPI(
    title="VPP Green Maharashtra AI Services",
    version="2.0.0",
    description=(
        "Unified AI micro-service powering the Vriksha Prahari Portal -- "
        "7 trained AI engines for tree health analysis (99% acc), "
        "species recognition (83% acc, 33 classes), growth estimation, "
        "carbon scoring, survival prediction (90% acc), duplicate "
        "detection, and GPS anomaly checking."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ────────────────────────────────────────────────
app.include_router(tree_health_router)
app.include_router(species_router)
app.include_router(growth_router)
app.include_router(carbon_router)
app.include_router(survival_router)
app.include_router(duplicate_router)
app.include_router(gps_router)

# ── Engine metadata (for /engines listing) ───────────────────────────

ENGINE_CATALOGUE: List[Dict[str, Any]] = [
    {
        "id": "tree_health",
        "name": "Tree Health Detection",
        "status": "active",
        "category": "Computer Vision",
        "algorithm": "ResNet-18 CNN (Trained)",
        "accuracy": "99.17%",
        "model_file": "health_cnn.pth",
        "avg_response_ms": 120,
        "endpoint": "/api/v1/ai/tree-health",
    },
    {
        "id": "species_recognition",
        "name": "Species Recognition",
        "status": "active",
        "category": "Computer Vision",
        "algorithm": "ResNet-18 CNN (Trained, 33 classes)",
        "accuracy": "83.00%",
        "model_file": "species_cnn.pth",
        "avg_response_ms": 150,
        "endpoint": "/api/v1/ai/species-recognition",
    },
    {
        "id": "growth_estimation",
        "name": "Growth Estimation",
        "status": "active",
        "category": "ML Classification",
        "algorithm": "Gradient Boosting (Trained)",
        "accuracy": "66.67%",
        "model_file": "growth_gb.pkl",
        "avg_response_ms": 45,
        "endpoint": "/api/v1/ai/growth-estimation",
    },
    {
        "id": "carbon_sequestration",
        "name": "Carbon Sequestration",
        "status": "active",
        "category": "ML + Scientific Formula",
        "algorithm": "Random Forest + IPCC Allometric",
        "accuracy": "90.00%",
        "model_file": "carbon_rf.pkl",
        "avg_response_ms": 30,
        "endpoint": "/api/v1/ai/carbon-score",
    },
    {
        "id": "survival_prediction",
        "name": "Survival Prediction",
        "status": "active",
        "category": "ML Classification",
        "algorithm": "Random Forest (Trained)",
        "accuracy": "90.00% (AUC 0.97)",
        "model_file": "survival_rf.pkl",
        "avg_response_ms": 55,
        "endpoint": "/api/v1/ai/survival-prediction",
    },
    {
        "id": "duplicate_detection",
        "name": "Duplicate Photo Detection",
        "status": "active",
        "category": "Fraud Intelligence",
        "algorithm": "Perceptual Hashing (pHash)",
        "accuracy": "100.00%",
        "avg_response_ms": 80,
        "endpoint": "/api/v1/ai/duplicate-check",
    },
    {
        "id": "gps_anomaly",
        "name": "GPS Anomaly Detection",
        "status": "active",
        "category": "Geospatial",
        "algorithm": "Rules + DBSCAN + Geofence",
        "accuracy": "100.00% F1",
        "avg_response_ms": 35,
        "endpoint": "/api/v1/ai/gps-anomaly-check",
    },
]


# ── Root & meta endpoints ───────────────────────────────────────────

@app.get("/")
async def root() -> Dict[str, Any]:
    """Redirect-friendly service banner."""
    return {
        "service": "VPP Green Maharashtra AI Services",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/ai/health",
    }


@app.get("/api/v1/ai/health")
async def health_check() -> Dict[str, Any]:
    """Liveness / readiness probe."""
    return {
        "status": "online",
        "engines": len(ENGINE_CATALOGUE),
        "active_engines": sum(1 for e in ENGINE_CATALOGUE if e["status"] == "active"),
        "version": "1.0.0",
        "uptime_seconds": int(time.time() - startup_time),
    }


@app.get("/api/v1/ai/engines")
async def list_engines() -> Dict[str, Any]:
    """Return metadata for every registered AI engine."""
    return {
        "success": True,
        "total": len(ENGINE_CATALOGUE),
        "data": ENGINE_CATALOGUE,
    }


# ══════════════════════════════════════════════════════════════════════
# ── Unified dispatcher endpoints (used by the frontend AiImageAnalyzer)
# ══════════════════════════════════════════════════════════════════════

class PredictRequest(BaseModel):
    engine_id: str
    payload: Dict[str, Any] = {}


@app.post("/api/v1/ai/predict")
async def unified_predict(request: PredictRequest) -> Dict[str, Any]:
    """
    Unified JSON prediction dispatcher.
    Routes to the correct engine based on ``engine_id``.
    Used by the frontend for non-image engines (growth, carbon,
    survival, GPS anomaly).
    """
    eid = request.engine_id
    p = request.payload

    try:
        if eid in ("growth_estimation", "growth_predictor"):
            req = GrowthRequest(
                plantation_id=p.get("plantation_id", "unknown"),
                monitoring_history=p.get("monitoring_history", []),
                species_name=p.get("species_name"),
                district=p.get("district"),
            )
            return await estimate_growth(req)

        elif eid in ("carbon_sequestration", "carbon_offset"):
            req = CarbonScoreRequest(
                user_id=p.get("user_id", "guest_user"),
                trees=p.get("trees", []),
                formula=p.get("formula", "ipcc")
            )
            return await carbon_score(req)

        elif eid in ("survival_prediction",):
            req = SurvivalRequest(**p)
            return await predict_survival(req)

        elif eid in ("gps_anomaly", "geotag_verification", "fraud_anomaly"):
            req = GpsAnomalyRequest(
                latitude=float(p.get("latitude", 0)),
                longitude=float(p.get("longitude", 0)),
                user_id=p.get("user_id", "anonymous"),
                institution_id=p.get("institution_id"),
            )
            return await check_gps_anomaly(req)

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown engine_id '{eid}' for JSON predict. "
                       f"Use /api/v1/ai/predict/image for image engines.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unified predict failed for engine=%s", eid)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/v1/ai/predict/image")
async def unified_predict_image(
    file: UploadFile = File(..., description="Image file to analyse"),
    engine_id: str = Form("tree_health"),
    expected_lat: Optional[str] = Form(None),
    expected_lng: Optional[str] = Form(None),
    user_id: str = Form("anonymous"),
    plantation_id: str = Form("unknown"),
) -> Dict[str, Any]:
    """
    Unified image prediction dispatcher.
    Routes to the correct image-based engine based on ``engine_id``.
    Used by the frontend AiImageAnalyzer component.
    """
    # ── Read and validate image ──────────────────────────────────
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Expected an image file")

    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 15 MB limit")

    eid = engine_id

    try:
        # ── Tree Health ──────────────────────────────────────────
        if eid in ("tree_health", "plant_health"):
            tensor = health_prepare(raw)
            result = health_predict(tensor)
            metrics = health_metrics(raw)
            status_key = result["status"]
            return {
                "success": True,
                "plantation_id": plantation_id,
                "health_status": result["status_label"],
                "confidence": result["confidence"],
                "remedy_suggestion": HEALTH_REMEDIES[status_key],
                "analysis_metrics": metrics,
                "ai_model_version": "2.0.0-resnet18-trained",
            }

        # ── Species Recognition ──────────────────────────────────
        elif eid in ("species_recognition", "tree_species"):
            tensor = species_prepare(raw)
            matches = species_predict(tensor, top_n=5)
            top = matches[0]
            return {
                "success": True,
                "recognized_species": {
                    "species_name": top["species_name"],
                    "scientific_name": top["scientific_name"],
                    "confidence": top["confidence"],
                    "source": "resnet18_cnn",
                    "calculated_co2_offset_kg_per_year": top.get("average_co2_absorption_kg_per_year", 0),
                    "native_to_maharashtra": top.get("native_to_maharashtra", False),
                    "description": top.get("description", ""),
                },
                "alternative_matches": matches[1:],
                "ai_model_version": "2.0.0-resnet18-trained",
            }

        # ── Duplicate Detection ──────────────────────────────────
        elif eid in ("duplicate_detection", "duplicate_check"):
            phash = _compute_phash(raw)
            ahash = _compute_ahash(raw)
            result = _check_against_store(user_id, phash, ahash)
            total_stored = _store_hash(
                user_id, phash, ahash, plantation_id, file.filename or "upload"
            )
            is_dup = result["verdict"] == "DUPLICATE"
            return {
                "success": True,
                "is_duplicate": is_dup,
                "confidence": "high" if result["confidence"] > 0.7 else "medium" if result["confidence"] > 0.3 else "low",
                "action": "reject" if is_dup else "accept",
                "duplicate_check": result,
                "ai_model_version": "1.0.0-phash",
            }

        # ── GPS / Geotag from image EXIF (fallback) ──────────────
        elif eid in ("gps_anomaly", "geotag_verification"):
            lat = float(expected_lat) if expected_lat else 0.0
            lng = float(expected_lng) if expected_lng else 0.0
            req = GpsAnomalyRequest(
                latitude=lat,
                longitude=lng,
                user_id=user_id,
            )
            return await check_gps_anomaly(req)

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown engine_id '{eid}' for image predict.",
            )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unified image predict failed for engine=%s", eid)
        raise HTTPException(status_code=500, detail=str(exc))


# ── Direct-run entry-point ──────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
