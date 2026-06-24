"""
VPP Green Maharashtra -- Survival Prediction Engine (v2 - ML)
===============================================================
Uses a trained RandomForestClassifier (survival_rf.pkl) with
predict_proba to estimate tree survival probability.

ML Model
--------
    Input features (12):
        tree_age, height, trunk_diameter, crown_area, species_id,
        soil_type, rainfall, temperature, sunlight_hours, leaf_density,
        drought_stress, pest_index
    Output classes:
        0 = Not_Survived | 1 = Survived

Risk Categories (derived from survival probability)
----------------------------------------------------
    > 0.80  -> Low
    0.60-0.80 -> Moderate
    0.40-0.60 -> High
    < 0.40  -> Critical

Author : VPP AI Team
Version: 2.0.0-random-forest-trained
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["Survival Prediction"])

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
    survival_model = _find_model("survival_rf.pkl")
    logger.info("survival_rf.pkl loaded successfully")
except FileNotFoundError:
    survival_model = None
    logger.warning("survival_rf.pkl not found -- ML predictions will be unavailable")

# -- ML class labels -----------------------------------------------------------

SURVIVAL_CLASSES: Dict[int, str] = {
    0: "Not_Survived",
    1: "Survived",
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

# -- Feature importance labels (for risk factor analysis) ----------------------

FEATURE_NAMES: List[str] = [
    "tree_age",
    "height",
    "trunk_diameter",
    "crown_area",
    "species_id",
    "soil_type",
    "rainfall",
    "temperature",
    "sunlight_hours",
    "leaf_density",
    "drought_stress",
    "pest_index",
]

# -- Pydantic request model ----------------------------------------------------

class SurvivalRequest(BaseModel):
    """Input features for survival prediction."""
    plantation_id: str
    species_name: Optional[str] = "Neem"
    # Core tree measurements
    tree_age: float = Field(1.0, gt=0, description="Tree age in years")
    height: float = Field(0.0, ge=0, description="Tree height in metres")
    trunk_diameter: float = Field(0.0, ge=0, description="Trunk diameter in cm")
    crown_area: float = Field(0.0, ge=0, description="Crown area in sq metres")
    # Environmental factors
    soil_type: str = Field("loamy", description="Soil type around the tree")
    rainfall: float = Field(1200.0, ge=0, description="Annual rainfall in mm")
    temperature: float = Field(28.0, description="Avg temperature in Celsius")
    sunlight_hours: float = Field(6.0, ge=0, description="Daily sunlight hours")
    leaf_density: float = Field(0.7, ge=0, le=1.0, description="Leaf density (0-1)")
    # Stress indicators
    drought_stress: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Drought stress index (0 = none, 1 = severe)"
    )
    pest_index: float = Field(
        0.0, ge=0.0, le=1.0,
        description="Pest/disease index (0 = none, 1 = severe)"
    )
    # Optional legacy fields (kept for backward compat, not fed to ML)
    health_status: Optional[str] = Field(
        None, description="Legacy: 'Healthy', 'At Risk', or 'Deceased'"
    )
    district: Optional[str] = None


# -- Feature builder -----------------------------------------------------------

def _build_features(req: SurvivalRequest) -> np.ndarray:
    """
    Build the 12-feature vector expected by the trained model.
    Order: tree_age, height, trunk_diameter, crown_area, species_id,
           soil_type, rainfall, temperature, sunlight_hours, leaf_density,
           drought_stress, pest_index
    """
    species_id = SPECIES_ID_MAP.get(req.species_name or "Neem", len(SPECIES_ID_MAP))
    soil_id = SOIL_TYPE_MAP.get(req.soil_type.lower(), len(SOIL_TYPE_MAP))

    return np.array([[
        req.tree_age,
        req.height,
        req.trunk_diameter,
        req.crown_area,
        float(species_id),
        float(soil_id),
        req.rainfall,
        req.temperature,
        req.sunlight_hours,
        req.leaf_density,
        req.drought_stress,
        req.pest_index,
    ]])


# -- Risk factor analysis -----------------------------------------------------

def _top_risk_factors(
    features: np.ndarray,
    n_top: int = 5,
) -> List[Dict[str, Any]]:
    """
    Identify the top risk factors using the model's feature importances.
    Falls back to a heuristic analysis when the model is unavailable.
    """
    feature_values = features[0]

    # Try to use model feature importances
    if survival_model is not None and hasattr(survival_model, "feature_importances_"):
        importances = survival_model.feature_importances_
        factors = []
        for idx, (name, importance) in enumerate(zip(FEATURE_NAMES, importances)):
            factors.append({
                "factor": name,
                "importance": round(float(importance), 4),
                "value": round(float(feature_values[idx]), 4),
            })
        factors.sort(key=lambda f: f["importance"], reverse=True)
        return factors[:n_top]

    # Heuristic fallback: flag stress-related features
    risk_items: List[Dict[str, Any]] = []
    stress_checks = [
        ("drought_stress", float(feature_values[10]), "High drought stress increases mortality risk"),
        ("pest_index", float(feature_values[11]), "Pest/disease pressure threatens survival"),
        ("leaf_density", 1.0 - float(feature_values[9]), "Low leaf density indicates poor health"),
        ("rainfall", max(0, 800 - float(feature_values[6])) / 800, "Insufficient rainfall for tree needs"),
        ("temperature", max(0, float(feature_values[7]) - 40) / 10, "Excessive heat stress"),
    ]
    for name, severity, description in stress_checks:
        if severity > 0.1:
            risk_items.append({
                "factor": name,
                "severity": round(severity, 4),
                "description": description,
            })
    risk_items.sort(key=lambda f: f["severity"], reverse=True)
    return risk_items[:n_top]


def _recommended_action(risk_level: str, factors: List[Dict[str, Any]]) -> str:
    """Generate human-readable recommendation based on risk level."""
    if risk_level == "Low":
        return "Tree is thriving. Maintain current care routine."
    if risk_level == "Moderate":
        top = factors[0]["factor"] if factors else "general care"
        return (
            f"Moderate risk detected. Focus on improving '{top}'. "
            "Schedule an on-site inspection within 2 weeks."
        )
    if risk_level == "High":
        return (
            "High risk of tree loss. Immediate on-site inspection recommended. "
            "Check for pest damage, water-logging, or soil degradation."
        )
    return (
        "Critical risk -- tree survival unlikely without urgent intervention. "
        "Deploy field team for root-zone assessment and possible replacement."
    )


# -- Core prediction logic ----------------------------------------------------

def _predict(req: SurvivalRequest) -> Dict[str, Any]:
    """Run the trained RandomForestClassifier and return prediction payload."""
    features = _build_features(req)

    # ML prediction
    if survival_model is not None:
        prediction = int(survival_model.predict(features)[0])
        predicted_label = SURVIVAL_CLASSES.get(prediction, "Unknown")

        # Use predict_proba for survival probability
        if hasattr(survival_model, "predict_proba"):
            proba = survival_model.predict_proba(features)[0]
            # Index 1 = Survived probability
            survival_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
        else:
            survival_prob = 1.0 if prediction == 1 else 0.0

        class_probabilities = {}
        if hasattr(survival_model, "predict_proba"):
            for idx, prob in enumerate(proba):
                class_name = SURVIVAL_CLASSES.get(idx, f"class_{idx}")
                class_probabilities[class_name] = round(float(prob), 4)
    else:
        # Fallback: simple heuristic when model is unavailable
        logger.warning("Using heuristic fallback -- model not loaded")
        base = 0.75
        base -= req.drought_stress * 0.3
        base -= req.pest_index * 0.25
        base += (req.leaf_density - 0.5) * 0.2
        survival_prob = round(min(max(base, 0.0), 1.0), 4)
        predicted_label = "Survived" if survival_prob >= 0.5 else "Not_Survived"
        class_probabilities = {
            "Not_Survived": round(1.0 - survival_prob, 4),
            "Survived": round(survival_prob, 4),
        }

    survival_prob = round(min(max(survival_prob, 0.0), 1.0), 4)

    # Risk level
    if survival_prob > 0.80:
        risk_level = "Low"
    elif survival_prob > 0.60:
        risk_level = "Moderate"
    elif survival_prob > 0.40:
        risk_level = "High"
    else:
        risk_level = "Critical"

    # Risk factors
    factors = _top_risk_factors(features)
    action = _recommended_action(risk_level, factors)

    return {
        "survival_probability": survival_prob,
        "predicted_outcome": predicted_label,
        "class_probabilities": class_probabilities,
        "risk_level": risk_level,
        "top_risk_factors": factors,
        "recommended_action": action,
    }


# -- FastAPI endpoint ----------------------------------------------------------

@router.post("/survival-prediction")
async def predict_survival(request: SurvivalRequest) -> Dict[str, Any]:
    """
    Predict tree survival probability from environmental, structural,
    and stress features using a trained RandomForest model.
    """
    try:
        prediction = _predict(request)
    except Exception as exc:
        logger.exception("Survival prediction failed")
        raise HTTPException(status_code=500, detail="Prediction error") from exc

    return {
        "success": True,
        "plantation_id": request.plantation_id,
        "species": request.species_name,
        "prediction": prediction,
        "ai_model_version": "2.0.0-random-forest-trained",
    }
