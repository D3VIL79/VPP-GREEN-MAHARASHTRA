"""
VPP Green Maharashtra -- Carbon Sequestration Engine (v2 - ML)
================================================================
Uses a trained RandomForestClassifier (carbon_rf.pkl) to classify
carbon sequestration level and the IPCC allometric model to compute
the actual CO2 absorption in kilograms.

ML Model
--------
    Input features (10):
        tree_age, height, trunk_diameter, crown_area, species_id,
        soil_type, rainfall, temperature, sunlight_hours, leaf_density
    Output classes:
        0 = Low | 1 = Medium | 2 = High | 3 = Very_High

IPCC Allometric (retained for kg calculation)
----------------------------------------------
    DBH   = annual_diameter_increment x age
    AGB   = exp(a + b x ln(DBH))          [kg]
    BGB   = AGB x root_shoot_ratio        [kg]
    Total = (AGB + BGB) x 0.47 x 3.667   [kg CO2]

Badge System
------------
    0 - 49 kg   -> Seed Starter       (5 pts)
    50 - 199    -> Sapling Guardian   (10 pts)
    200 - 499   -> Green Warrior      (15 pts)
    500 - 999   -> Carbon Champion    (25 pts)
    1000+       -> Climate Hero       (50 pts)

Author : VPP AI Team
Version: 2.0.0-random-forest-trained
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["Carbon Sequestration"])

# -- Model loading ------------------------------------------------------------

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


# Load the trained RandomForestClassifier at module level
try:
    carbon_model = _find_model("carbon_rf.pkl")
    logger.info("carbon_rf.pkl loaded successfully")
except FileNotFoundError:
    carbon_model = None
    logger.warning("carbon_rf.pkl not found -- ML predictions will be unavailable")

# -- ML class labels -----------------------------------------------------------

CARBON_CLASSES: Dict[int, str] = {
    0: "Low",
    1: "Medium",
    2: "High",
    3: "Very_High",
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

# -- Species allometric parameters (for IPCC kg calculation) -------------------

SPECIES_PARAMS: Dict[str, Dict[str, float]] = {
    "Neem":                {"allometric_a": -2.50, "allometric_b": 2.50, "annual_diameter_cm": 1.5, "root_shoot_ratio": 0.26, "simple_rate_kg_yr": 22.6},
    "Banyan":              {"allometric_a": -2.30, "allometric_b": 2.55, "annual_diameter_cm": 1.8, "root_shoot_ratio": 0.30, "simple_rate_kg_yr": 28.5},
    "Peepal":              {"allometric_a": -2.40, "allometric_b": 2.52, "annual_diameter_cm": 1.6, "root_shoot_ratio": 0.28, "simple_rate_kg_yr": 26.0},
    "Mango":               {"allometric_a": -2.45, "allometric_b": 2.48, "annual_diameter_cm": 1.4, "root_shoot_ratio": 0.25, "simple_rate_kg_yr": 20.0},
    "Jamun":               {"allometric_a": -2.55, "allometric_b": 2.45, "annual_diameter_cm": 1.3, "root_shoot_ratio": 0.24, "simple_rate_kg_yr": 19.5},
    "Ashoka":              {"allometric_a": -2.60, "allometric_b": 2.42, "annual_diameter_cm": 1.2, "root_shoot_ratio": 0.22, "simple_rate_kg_yr": 15.0},
    "Gulmohar":            {"allometric_a": -2.35, "allometric_b": 2.50, "annual_diameter_cm": 1.7, "root_shoot_ratio": 0.27, "simple_rate_kg_yr": 18.0},
    "Coconut":             {"allometric_a": -2.70, "allometric_b": 2.38, "annual_diameter_cm": 1.0, "root_shoot_ratio": 0.20, "simple_rate_kg_yr": 12.0},
    "Teak":                {"allometric_a": -2.28, "allometric_b": 2.58, "annual_diameter_cm": 1.6, "root_shoot_ratio": 0.28, "simple_rate_kg_yr": 24.0},
    "Tamarind":            {"allometric_a": -2.42, "allometric_b": 2.48, "annual_diameter_cm": 1.3, "root_shoot_ratio": 0.26, "simple_rate_kg_yr": 21.0},
    "Indian Almond":       {"allometric_a": -2.50, "allometric_b": 2.45, "annual_diameter_cm": 1.4, "root_shoot_ratio": 0.25, "simple_rate_kg_yr": 17.5},
    "Rain Tree":           {"allometric_a": -2.20, "allometric_b": 2.60, "annual_diameter_cm": 2.0, "root_shoot_ratio": 0.30, "simple_rate_kg_yr": 30.0},
    "Indian Rosewood":     {"allometric_a": -2.32, "allometric_b": 2.55, "annual_diameter_cm": 1.5, "root_shoot_ratio": 0.27, "simple_rate_kg_yr": 23.0},
    "Kadamba":              {"allometric_a": -2.55, "allometric_b": 2.44, "annual_diameter_cm": 1.3, "root_shoot_ratio": 0.23, "simple_rate_kg_yr": 16.0},
    "Flame of the Forest": {"allometric_a": -2.62, "allometric_b": 2.40, "annual_diameter_cm": 1.1, "root_shoot_ratio": 0.22, "simple_rate_kg_yr": 14.0},
}

DEFAULT_PARAMS: Dict[str, float] = {
    "allometric_a": -2.50,
    "allometric_b": 2.50,
    "annual_diameter_cm": 1.5,
    "root_shoot_ratio": 0.26,
    "simple_rate_kg_yr": 20.0,
}

# -- Badge thresholds ----------------------------------------------------------

BADGE_TABLE = [
    (0,    50,   "Seed Starter",     5),
    (50,   200,  "Sapling Guardian", 10),
    (200,  500,  "Green Warrior",    15),
    (500,  1000, "Carbon Champion",  25),
    (1000, 1e9,  "Climate Hero",     50),
]

# -- Constants -----------------------------------------------------------------

CARBON_FRACTION = 0.47          # fraction of biomass that is carbon
CO2_CONVERSION = 3.667          # kg CO2 per kg carbon
KM_DRIVING_PER_KG_CO2 = 4.76   # avg km offset per kg CO2 (EU avg car)


# -- Core calculations --------------------------------------------------------

def calculate_co2_ipcc(species_data: Dict[str, float], tree_age_years: float) -> float:
    """
    IPCC allometric CO2 calculation.
    Returns total CO2 absorbed (kg) over the tree's lifetime.
    """
    annual_d = species_data.get("annual_diameter_cm", 1.5)
    dbh_cm = annual_d * tree_age_years
    if dbh_cm <= 0:
        return 0.0

    a = species_data.get("allometric_a", -2.5)
    b = species_data.get("allometric_b", 2.5)
    rs = species_data.get("root_shoot_ratio", 0.26)

    agb_kg = math.exp(a + b * math.log(dbh_cm))
    bgb_kg = agb_kg * rs
    total_biomass_kg = agb_kg + bgb_kg
    carbon_kg = total_biomass_kg * CARBON_FRACTION
    co2_kg = carbon_kg * CO2_CONVERSION
    return round(co2_kg, 2)


def _get_badge(total_co2_kg: float):
    """Return (badge_name, points) for a given CO2 total."""
    for lo, hi, badge, pts in BADGE_TABLE:
        if lo <= total_co2_kg < hi:
            return badge, pts
    return "Climate Hero", 50


def _predict_carbon_class(features: np.ndarray) -> Dict[str, Any]:
    """
    Run the trained RandomForestClassifier on a single sample.
    Returns the predicted class label and per-class probabilities.
    """
    if carbon_model is None:
        return {"carbon_class": "Unknown", "class_probabilities": {}}

    prediction = int(carbon_model.predict(features)[0])
    label = CARBON_CLASSES.get(prediction, "Unknown")

    probabilities: Dict[str, float] = {}
    if hasattr(carbon_model, "predict_proba"):
        proba = carbon_model.predict_proba(features)[0]
        for idx, prob in enumerate(proba):
            class_name = CARBON_CLASSES.get(idx, f"class_{idx}")
            probabilities[class_name] = round(float(prob), 4)

    return {"carbon_class": label, "class_probabilities": probabilities}


# -- Pydantic models ----------------------------------------------------------

class TreeEntry(BaseModel):
    """Single tree in the user's portfolio with ML feature inputs."""
    species_name: str = "Neem"
    age_years: float = Field(..., gt=0, description="Tree age in years")
    count: int = Field(1, ge=1, description="Number of trees of this species/age")
    height: float = Field(0.0, ge=0, description="Tree height in metres")
    trunk_diameter: float = Field(0.0, ge=0, description="Trunk diameter in cm")
    crown_area: float = Field(0.0, ge=0, description="Crown area in sq metres")
    soil_type: str = Field("loamy", description="Soil type around the tree")
    rainfall: float = Field(1200.0, ge=0, description="Annual rainfall in mm")
    temperature: float = Field(28.0, description="Avg temperature in Celsius")
    sunlight_hours: float = Field(6.0, ge=0, description="Daily sunlight hours")
    leaf_density: float = Field(0.7, ge=0, le=1.0, description="Leaf density (0-1)")


class CarbonScoreRequest(BaseModel):
    """Request for individual user carbon score."""
    user_id: str
    trees: List[TreeEntry] = Field(..., min_length=1)
    formula: Optional[str] = Field("ipcc", description="'ipcc' or 'simple'")


class InstitutionCarbonRequest(BaseModel):
    """Request for institutional carbon score."""
    institution_id: str
    trees: Optional[List[TreeEntry]] = None
    formula: Optional[str] = "ipcc"


# -- Feature builder -----------------------------------------------------------

def _build_features(tree: TreeEntry) -> np.ndarray:
    """
    Build the 10-feature vector expected by the trained model.
    Order: tree_age, height, trunk_diameter, crown_area, species_id,
           soil_type, rainfall, temperature, sunlight_hours, leaf_density
    """
    species_id = SPECIES_ID_MAP.get(tree.species_name, len(SPECIES_ID_MAP))
    soil_id = SOIL_TYPE_MAP.get(tree.soil_type.lower(), len(SOIL_TYPE_MAP))

    return np.array([[
        tree.age_years,
        tree.height,
        tree.trunk_diameter,
        tree.crown_area,
        float(species_id),
        float(soil_id),
        tree.rainfall,
        tree.temperature,
        tree.sunlight_hours,
        tree.leaf_density,
    ]])


# -- FastAPI endpoints ---------------------------------------------------------

@router.post("/carbon-score")
async def carbon_score(request: CarbonScoreRequest) -> Dict[str, Any]:
    """
    Calculate total CO2 absorption for a user's tree portfolio.
    Uses the trained ML model for carbon-level classification and
    the IPCC allometric formula for actual kg computation.
    """
    use_simple = request.formula == "simple"
    breakdown: List[Dict[str, Any]] = []
    total_co2 = 0.0
    total_trees = 0

    for tree in request.trees:
        sp_data = SPECIES_PARAMS.get(tree.species_name, DEFAULT_PARAMS)

        # IPCC / simple CO2 kg calculation
        if use_simple:
            rate = sp_data.get("simple_rate_kg_yr", 20.0)
            co2_per_tree = round(rate * tree.age_years, 2)
        else:
            co2_per_tree = calculate_co2_ipcc(sp_data, tree.age_years)

        co2_total = co2_per_tree * tree.count
        total_co2 += co2_total
        total_trees += tree.count

        # ML classification
        features = _build_features(tree)
        ml_result = _predict_carbon_class(features)

        breakdown.append({
            "species": tree.species_name,
            "age_years": tree.age_years,
            "count": tree.count,
            "co2_per_tree_kg": co2_per_tree,
            "co2_total_kg": round(co2_total, 2),
            "formula_used": request.formula or "ipcc",
            "ml_carbon_class": ml_result["carbon_class"],
            "ml_class_probabilities": ml_result["class_probabilities"],
        })

    badge, points = _get_badge(total_co2)

    return {
        "success": True,
        "user_id": request.user_id,
        "carbon_data": {
            "total_co2_absorbed_kg": round(total_co2, 2),
            "total_co2_absorbed_tonnes": round(total_co2 / 1000, 4),
            "equivalent_km_driving_offset": round(total_co2 * KM_DRIVING_PER_KG_CO2),
            "points": points,
            "badge": badge,
            "trees_counted": total_trees,
            "breakdown_by_species": breakdown,
        },
        "ai_model_version": "2.0.0-random-forest-trained",
    }


@router.post("/carbon-score/institution")
async def institution_carbon_score(request: InstitutionCarbonRequest) -> Dict[str, Any]:
    """
    Calculate aggregate CO2 absorption for an institution.
    If no trees list is provided, returns a demo summary using
    a default distribution of species.
    """
    trees = request.trees
    if not trees:
        trees = [
            TreeEntry(species_name="Neem",     age_years=3, count=50, height=4.5,  trunk_diameter=12.0, crown_area=8.0),
            TreeEntry(species_name="Banyan",   age_years=5, count=20, height=7.0,  trunk_diameter=20.0, crown_area=15.0),
            TreeEntry(species_name="Peepal",   age_years=2, count=40, height=3.0,  trunk_diameter=8.0,  crown_area=5.0),
            TreeEntry(species_name="Mango",    age_years=4, count=30, height=5.5,  trunk_diameter=15.0, crown_area=10.0),
            TreeEntry(species_name="Gulmohar", age_years=1, count=60, height=1.5,  trunk_diameter=4.0,  crown_area=2.0),
        ]

    use_simple = request.formula == "simple"
    breakdown: List[Dict[str, Any]] = []
    total_co2 = 0.0
    total_trees = 0

    for tree in trees:
        sp_data = SPECIES_PARAMS.get(tree.species_name, DEFAULT_PARAMS)

        if use_simple:
            rate = sp_data.get("simple_rate_kg_yr", 20.0)
            co2_per_tree = round(rate * tree.age_years, 2)
        else:
            co2_per_tree = calculate_co2_ipcc(sp_data, tree.age_years)

        co2_total = co2_per_tree * tree.count
        total_co2 += co2_total
        total_trees += tree.count

        features = _build_features(tree)
        ml_result = _predict_carbon_class(features)

        breakdown.append({
            "species": tree.species_name,
            "age_years": tree.age_years,
            "count": tree.count,
            "co2_per_tree_kg": co2_per_tree,
            "co2_total_kg": round(co2_total, 2),
            "ml_carbon_class": ml_result["carbon_class"],
        })

    badge, points = _get_badge(total_co2)

    return {
        "success": True,
        "institution_id": request.institution_id,
        "carbon_data": {
            "total_co2_absorbed_kg": round(total_co2, 2),
            "total_co2_absorbed_tonnes": round(total_co2 / 1000, 4),
            "equivalent_km_driving_offset": round(total_co2 * KM_DRIVING_PER_KG_CO2),
            "points": points,
            "badge": badge,
            "trees_counted": total_trees,
            "breakdown_by_species": breakdown,
        },
        "ai_model_version": "2.0.0-random-forest-trained",
    }
