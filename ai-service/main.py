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

import time
from typing import Any, Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Engine routers ───────────────────────────────────────────────────
from engines.tree_health import router as tree_health_router
from engines.species_recognition import router as species_router
from engines.growth_estimation import router as growth_router
from engines.carbon_sequestration import router as carbon_router
from engines.survival_prediction import router as survival_router
from engines.duplicate_detection import router as duplicate_router
from engines.gps_anomaly import router as gps_router

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


# ── Direct-run entry-point ──────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
