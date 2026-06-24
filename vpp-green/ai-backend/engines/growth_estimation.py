"""
VPP Green Maharashtra -- Growth Estimation Engine (v2 - ML)
=============================================================
Uses a trained GradientBoostingClassifier (growth_gb.pkl) to classify
tree growth rate and retains the linear-regression extrapolation on
monitoring history for trend and benchmark comparison.

ML Model
--------
    Input features (10):
        tree_age, height, trunk_diameter, crown_area, species_id,
        soil_type, rainfall, temperature, sunlight_hours, leaf_density
    Output classes:
        0 = Slow | 1 = Moderate | 2 = Fast | 3 = Very_Fast

Author : VPP AI Team
Version: 2.0.0-gradient-boosting-trained
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["Growth Estimation"])

# -- Model loading -------------------------------------------------------------

def _find_model(filename: str):
    """Locate and load a joblib model from known candidate paths."""
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "vpp-green" / "ai-backend" / "models" / filename,
        Path(__file__).resolve().parent.parent / "models" / filename,
        Path(".") / "models" / filename,
    ]
    for p in candidates:
        if p.exists():
            logger.info("Loading model from %s", p)
            return joblib.load(p)
    raise FileNotFoundError(
        f"Model {filename} not found in: {[str(c) for c in candidates]}"
    )


try:
    growth_model = _find_model("growth_gb.pkl")
    logger.info("growth_gb.pkl loaded successfully")
except FileNotFoundError:
    growth_model = None
    logger.warning("growth_gb.pkl not found -- ML predictions will be unavailable")

# -- ML class labels -----------------------------------------------------------

GROWTH_CLASSES: Dict[int, str] = {
    0: "Slow",
    1: "Moderate",
    2: "Fast",
    3: "Very_Fast",
}

# -- Species-to-ID mapping (must match training encoding) ----------------------

SPECIES_ID_MAP: Dict[str, int] = {
    "Neem": 0,
    "Banyan": 1,
    "Peepal": 2,
    "Mango": 3,
    "Jamun": 4,
    "Ashoka": 5,
    "Gulmohar": 6,
    "Coconut": 7,
    "Teak": 8,
    "Tamarind": 9,
    "Indian Almond": 10,
    "Rain Tree": 11,
    "Indian Rosewood": 12,
    "Kadamba": 13,
    "Flame of the Forest": 14,
}

# -- Soil-type-to-ID mapping ---------------------------------------------------

SOIL_TYPE_MAP: Dict[str, int] = {
    "alluvial": 0,
    "black": 1,
    "red": 2,
    "laterite": 3,
    "sandy": 4,
    "clay": 5,
    "loamy": 6,
}

# -- Pydantic models ----------------------------------------------------------

class MonitoringEntry(BaseModel):
    """Single monitoring data-point."""
    cycle: int = Field(..., ge=0, description="Monitoring cycle number (0-based)")
    height_cm: float = Field(..., gt=0, description="Measured height in cm")
    canopy_cm: Optional[float] = Field(None, ge=0, description="Canopy spread in cm")
    date: str = Field(..., description="ISO date of measurement, e.g. 2025-06-01")


class GrowthRequest(BaseModel):
    """Request body for growth estimation."""
    plantation_id: str = Field(..., min_length=1)
    monitoring_history: List[MonitoringEntry] = Field(..., min_length=1)
    species_name: Optional[str] = "Neem"
    district: Optional[str] = "Mumbai"
    # ML feature inputs
    tree_age: float = Field(1.0, gt=0, description="Tree age in years")
    height: float = Field(0.0, ge=0, description="Current height in metres")
    trunk_diameter: float = Field(0.0, ge=0, description="Trunk diameter in cm")
    crown_area: float = Field(0.0, ge=0, description="Crown area in sq metres")
    soil_type: str = Field("loamy", description="Soil type around the tree")
    rainfall: float = Field(1200.0, ge=0, description="Annual rainfall in mm")
    temperature: float = Field(28.0, description="Avg temperature in Celsius")
    sunlight_hours: float = Field(6.0, ge=0, description="Daily sunlight hours")
    leaf_density: float = Field(0.7, ge=0, le=1.0, description="Leaf density (0-1)")


# -- Species growth benchmarks (retained for trend comparison) -----------------

GROWTH_BENCHMARKS: Dict[str, Dict[str, Any]] = {
    "Neem": {
        "height_at_cycle": {0: 15, 1: 28, 2: 42, 3: 58, 4: 75, 5: 90, 6: 108, 7: 125, 8: 140},
        "canopy_ratio": 0.60,
        "hardiness": 0.85,
    },
    "Banyan": {
        "height_at_cycle": {0: 12, 1: 22, 2: 35, 3: 50, 4: 68, 5: 85, 6: 105, 7: 128, 8: 150},
        "canopy_ratio": 0.75,
        "hardiness": 0.90,
    },
    "Peepal": {
        "height_at_cycle": {0: 14, 1: 26, 2: 40, 3: 55, 4: 72, 5: 88, 6: 106, 7: 124, 8: 142},
        "canopy_ratio": 0.65,
        "hardiness": 0.88,
    },
    "Mango": {
        "height_at_cycle": {0: 12, 1: 24, 2: 38, 3: 52, 4: 68, 5: 82, 6: 98, 7: 115, 8: 130},
        "canopy_ratio": 0.70,
        "hardiness": 0.80,
    },
    "Gulmohar": {
        "height_at_cycle": {0: 18, 1: 34, 2: 52, 3: 72, 4: 92, 5: 112, 6: 134, 7: 156, 8: 178},
        "canopy_ratio": 0.80,
        "hardiness": 0.65,
    },
    "Teak": {
        "height_at_cycle": {0: 16, 1: 30, 2: 46, 3: 64, 4: 82, 5: 100, 6: 120, 7: 140, 8: 160},
        "canopy_ratio": 0.55,
        "hardiness": 0.82,
    },
    "Coconut": {
        "height_at_cycle": {0: 10, 1: 18, 2: 28, 3: 40, 4: 54, 5: 70, 6: 88, 7: 108, 8: 130},
        "canopy_ratio": 0.50,
        "hardiness": 0.70,
    },
    "Jamun": {
        "height_at_cycle": {0: 13, 1: 25, 2: 38, 3: 53, 4: 68, 5: 84, 6: 100, 7: 118, 8: 135},
        "canopy_ratio": 0.62,
        "hardiness": 0.83,
    },
    "Tamarind": {
        "height_at_cycle": {0: 11, 1: 20, 2: 32, 3: 45, 4: 60, 5: 76, 6: 92, 7: 110, 8: 128},
        "canopy_ratio": 0.68,
        "hardiness": 0.86,
    },
    "Ashoka": {
        "height_at_cycle": {0: 14, 1: 26, 2: 40, 3: 56, 4: 72, 5: 88, 6: 105, 7: 122, 8: 138},
        "canopy_ratio": 0.45,
        "hardiness": 0.75,
    },
}

DEFAULT_BENCHMARK: Dict[str, Any] = {
    "height_at_cycle": {0: 14, 1: 26, 2: 40, 3: 55, 4: 72, 5: 88, 6: 106, 7: 124, 8: 142},
    "canopy_ratio": 0.60,
    "hardiness": 0.75,
}

# -- District-level seasonal adjustment factors --------------------------------

DISTRICT_ADJUSTMENT: Dict[str, float] = {
    "Mumbai": 1.05,
    "Pune": 1.00,
    "Nagpur": 0.95,
    "Nashik": 0.98,
    "Kolhapur": 1.03,
    "Aurangabad": 0.92,
    "Solapur": 0.90,
    "Thane": 1.04,
    "Ratnagiri": 1.06,
}


# -- Math helpers --------------------------------------------------------------

def _linear_regression(x: np.ndarray, y: np.ndarray) -> Tuple[float, float, float]:
    """
    Simple OLS linear regression.
    Returns (slope, intercept, residual_std_error).
    """
    n = len(x)
    if n < 2:
        return (y[-1] - y[0]) if n == 1 else 0.0, float(y[0]) if n else 0.0, 0.0

    x_mean, y_mean = np.mean(x), np.mean(y)
    ss_xx = np.sum((x - x_mean) ** 2)
    ss_xy = np.sum((x - x_mean) * (y - y_mean))

    slope = float(ss_xy / ss_xx) if ss_xx > 0 else 0.0
    intercept = float(y_mean - slope * x_mean)

    residuals = y - (slope * x + intercept)
    rse = float(np.std(residuals)) if n > 2 else abs(float(residuals[-1])) if n == 2 else 0.0

    return slope, intercept, rse


def _extrapolate(
    slope: float, intercept: float, next_cycle: int, rse: float
) -> Tuple[float, float, float]:
    """Return (predicted, lower_bound, upper_bound) for next_cycle."""
    predicted = slope * next_cycle + intercept
    margin = 1.96 * rse  # ~95% CI
    return predicted, predicted - margin, predicted + margin


# -- Feature builder -----------------------------------------------------------

def _build_features(request: GrowthRequest) -> np.ndarray:
    """
    Build the 10-feature vector expected by the trained model.
    Order: tree_age, height, trunk_diameter, crown_area, species_id,
           soil_type, rainfall, temperature, sunlight_hours, leaf_density
    """
    species_id = SPECIES_ID_MAP.get(request.species_name or "Neem", len(SPECIES_ID_MAP))
    soil_id = SOIL_TYPE_MAP.get(request.soil_type.lower(), len(SOIL_TYPE_MAP))

    return np.array([[
        request.tree_age,
        request.height,
        request.trunk_diameter,
        request.crown_area,
        float(species_id),
        float(soil_id),
        request.rainfall,
        request.temperature,
        request.sunlight_hours,
        request.leaf_density,
    ]])


def _predict_growth_class(features: np.ndarray) -> Dict[str, Any]:
    """
    Run the trained GradientBoostingClassifier on a single sample.
    Returns predicted growth class label and per-class probabilities.
    """
    if growth_model is None:
        return {"growth_class": "Unknown", "class_probabilities": {}}

    prediction = int(growth_model.predict(features)[0])
    label = GROWTH_CLASSES.get(prediction, "Unknown")

    probabilities: Dict[str, float] = {}
    if hasattr(growth_model, "predict_proba"):
        proba = growth_model.predict_proba(features)[0]
        for idx, prob in enumerate(proba):
            class_name = GROWTH_CLASSES.get(idx, f"class_{idx}")
            probabilities[class_name] = round(float(prob), 4)

    return {"growth_class": label, "class_probabilities": probabilities}


# -- Core estimation logic -----------------------------------------------------

def _estimate(request: GrowthRequest) -> Dict[str, Any]:
    """Run the full growth estimation pipeline (regression + ML)."""
    species = request.species_name or "Neem"
    bench = GROWTH_BENCHMARKS.get(species, DEFAULT_BENCHMARK)
    district_factor = DISTRICT_ADJUSTMENT.get(request.district or "", 1.0)

    history = sorted(request.monitoring_history, key=lambda e: e.cycle)
    cycles = np.array([e.cycle for e in history], dtype=np.float64)
    heights = np.array([e.height_cm for e in history], dtype=np.float64)

    # Height regression
    h_slope, h_intercept, h_rse = _linear_regression(cycles, heights)
    next_cycle = int(cycles[-1]) + 1
    pred_h, lo_h, hi_h = _extrapolate(h_slope, h_intercept, next_cycle, h_rse)

    # Apply district adjustment
    pred_h *= district_factor
    lo_h *= district_factor
    hi_h *= district_factor

    # Canopy regression (if data available)
    canopies = [e.canopy_cm for e in history if e.canopy_cm is not None]
    if len(canopies) >= 2:
        c_arr = np.array(canopies, dtype=np.float64)
        c_cycles = cycles[: len(canopies)]
        c_slope, c_int, _ = _linear_regression(c_cycles, c_arr)
        pred_c = (c_slope * next_cycle + c_int) * district_factor
    else:
        pred_c = pred_h * bench["canopy_ratio"]

    # Benchmark comparison
    bench_heights = bench["height_at_cycle"]
    expected = bench_heights.get(next_cycle, None)
    if expected is None:
        max_cycle = max(bench_heights.keys())
        if next_cycle > max_cycle:
            last_two = sorted(bench_heights.keys())[-2:]
            b_slope = (bench_heights[last_two[1]] - bench_heights[last_two[0]]) / (
                last_two[1] - last_two[0]
            )
            expected = bench_heights[last_two[1]] + b_slope * (next_cycle - last_two[1])
        else:
            expected = pred_h

    deviation_pct = ((pred_h - expected) / expected * 100) if expected > 0 else 0

    if abs(deviation_pct) <= 20:
        comparison = "within_expected_range"
    elif deviation_pct > 20:
        comparison = "above_expected_range"
    else:
        comparison = "below_expected_range"

    # Regression-based growth trend
    if h_slope > 0 and abs(deviation_pct) <= 20:
        trend = "normal"
    elif h_slope > 0 and deviation_pct > 20:
        trend = "accelerated"
    elif h_slope > 0 and deviation_pct < -20:
        trend = "slow"
    elif h_slope <= 0:
        trend = "stagnant"
    else:
        trend = "normal"

    # Alert
    alert = None
    if trend == "stagnant":
        alert = "Tree growth has stagnated. Inspect for root damage or nutrient deficiency."
    elif trend == "slow":
        alert = "Growth is below expected range. Consider soil amendment and additional watering."
    elif comparison == "below_expected_range" and trend != "slow":
        alert = "Height is below benchmark. Monitor closely next cycle."

    # ML growth classification
    features = _build_features(request)
    ml_result = _predict_growth_class(features)

    return {
        "next_cycle": next_cycle,
        "next_cycle_height_cm": round(max(pred_h, 0), 1),
        "next_cycle_canopy_cm": round(max(pred_c, 0), 1),
        "confidence_interval": {
            "min": round(max(lo_h, 0), 1),
            "max": round(max(hi_h, 0), 1),
        },
        "growth_trend": trend,
        "ml_growth_class": ml_result["growth_class"],
        "ml_class_probabilities": ml_result["class_probabilities"],
        "benchmark_comparison": comparison,
        "benchmark_expected_cm": round(expected, 1),
        "deviation_pct": round(deviation_pct, 1),
        "district_adjustment_factor": district_factor,
        "alert": alert,
    }


# -- FastAPI endpoint ----------------------------------------------------------

@router.post("/growth-estimation")
async def estimate_growth(request: GrowthRequest) -> Dict[str, Any]:
    """
    Predict next-cycle tree height and canopy from monitoring history,
    classify growth rate with the trained GradientBoosting model, and
    compare against species-specific growth benchmarks.
    """
    if len(request.monitoring_history) == 0:
        raise HTTPException(status_code=400, detail="At least one monitoring entry is required")

    try:
        predictions = _estimate(request)
    except Exception as exc:
        logger.exception("Growth estimation failed")
        raise HTTPException(status_code=500, detail="Estimation error") from exc

    return {
        "success": True,
        "plantation_id": request.plantation_id,
        "species": request.species_name,
        "district": request.district,
        "cycles_provided": len(request.monitoring_history),
        "predictions": predictions,
        "ai_model_version": "2.0.0-gradient-boosting-trained",
    }
