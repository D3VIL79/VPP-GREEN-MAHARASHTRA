"""
VPP Green Maharashtra — GPS Anomaly Detection Engine
======================================================
Three-layer geospatial fraud detection for tree plantation GPS data.

Layer 1 — Rule-based checks
    • Maharashtra bounding-box (lat 15.6–22.1, lon 72.6–80.9)
    • Zero-coordinate rejection
    • Precision check (< 4 decimal places → suspicious)
    • Distance from institution > 150 km → warning

Layer 2 — DBSCAN clustering
    • Clusters user's historical coordinates
    • eps = 5 m (~0.000045°), min_samples = 3
    • Points in dense clusters flagged as potential farm-fraud

Layer 3 — Geofence polygon containment
    • Checks whether point falls inside a provided polygon
    • Uses ray-casting algorithm

An aggregate anomaly score (0–100) drives the final decision:
    0  – 30   →  ACCEPT
    31 – 60   →  FLAG_FOR_REVIEW
    61 – 100  →  REJECT

Author : VPP AI Team
Version: 1.0.0-rules+dbscan
"""

from __future__ import annotations

import logging
import math
import threading
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["GPS Anomaly"])

# ── Constants ────────────────────────────────────────────────────────

# Maharashtra approximate bounding box
MH_LAT_MIN, MH_LAT_MAX = 15.6, 22.1
MH_LON_MIN, MH_LON_MAX = 72.6, 80.9

EARTH_RADIUS_KM = 6371.0
MAX_INSTITUTION_DISTANCE_KM = 150.0
MIN_DECIMAL_PLACES = 4

# DBSCAN parameters (eps in degrees ≈ 5 m)
DBSCAN_EPS_DEG = 0.000045
DBSCAN_MIN_SAMPLES = 3

# ── In-memory coordinate store (user_id → list of (lat, lon)) ────────
_lock = threading.Lock()
_coord_store: Dict[str, List[Tuple[float, float]]] = defaultdict(list)


# ── Pydantic models ──────────────────────────────────────────────────

class GpsPoint(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class GeofencePolygon(BaseModel):
    """Simple polygon defined by ordered vertices."""
    vertices: List[GpsPoint] = Field(
        default=[],
        description="Polygon vertices in order. Empty = skip geofence check.",
    )


class GpsAnomalyRequest(BaseModel):
    user_id: str
    plantation_id: str = "unknown"
    coordinates: GpsPoint
    institution_coordinates: Optional[GpsPoint] = None
    geofence: Optional[GeofencePolygon] = None


# ── Geo helpers ──────────────────────────────────────────────────────

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _decimal_places(value: float) -> int:
    """Count decimal places of a float."""
    s = f"{value:.15g}"
    if "." not in s:
        return 0
    return len(s.split(".")[1].rstrip("0"))


def _point_in_polygon(lat: float, lon: float, polygon: List[Tuple[float, float]]) -> bool:
    """Ray-casting algorithm for point-in-polygon."""
    n = len(polygon)
    if n < 3:
        return True  # degenerate polygon → skip
    inside = False
    j = n - 1
    for i in range(n):
        yi, xi = polygon[i]
        yj, xj = polygon[j]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi
        ):
            inside = not inside
        j = i
    return inside


# ── Layer 1: Rule-based checks ──────────────────────────────────────

def _layer1_rules(req: GpsAnomalyRequest) -> Dict[str, Any]:
    """Return individual rule results and a partial anomaly score (0–40)."""
    lat = req.coordinates.latitude
    lon = req.coordinates.longitude
    flags: List[str] = []
    score = 0.0

    # Zero coordinate check
    if lat == 0.0 and lon == 0.0:
        flags.append("zero_coordinates")
        score += 40.0  # instant reject-level

    # Maharashtra bounds
    in_mh = MH_LAT_MIN <= lat <= MH_LAT_MAX and MH_LON_MIN <= lon <= MH_LON_MAX
    if not in_mh and not (lat == 0.0 and lon == 0.0):
        flags.append("outside_maharashtra")
        score += 25.0

    # Precision check
    lat_dp = _decimal_places(lat)
    lon_dp = _decimal_places(lon)
    if lat_dp < MIN_DECIMAL_PLACES or lon_dp < MIN_DECIMAL_PLACES:
        flags.append("low_gps_precision")
        score += 10.0

    # Distance from institution
    inst_dist_km: Optional[float] = None
    if req.institution_coordinates:
        inst_dist_km = _haversine(
            lat, lon,
            req.institution_coordinates.latitude,
            req.institution_coordinates.longitude,
        )
        if inst_dist_km > MAX_INSTITUTION_DISTANCE_KM:
            flags.append("far_from_institution")
            score += 15.0

    return {
        "flags": flags,
        "score": min(score, 40.0),
        "in_maharashtra": in_mh,
        "institution_distance_km": round(inst_dist_km, 2) if inst_dist_km is not None else None,
        "coordinate_precision": {"lat_decimals": lat_dp, "lon_decimals": lon_dp},
    }


# ── Layer 2: DBSCAN clustering ──────────────────────────────────────

def _layer2_dbscan(user_id: str, lat: float, lon: float) -> Dict[str, Any]:
    """
    Lightweight DBSCAN on the user's coordinate history.

    We use scikit-learn's DBSCAN.  If fewer than DBSCAN_MIN_SAMPLES
    points exist, skip clustering.
    """
    with _lock:
        history = list(_coord_store[user_id])

    history.append((lat, lon))

    if len(history) < DBSCAN_MIN_SAMPLES:
        return {
            "cluster_detected": False,
            "points_analysed": len(history),
            "score": 0.0,
            "detail": "Not enough data for clustering",
        }

    try:
        from sklearn.cluster import DBSCAN  # deferred import

        coords = np.array(history)
        db = DBSCAN(eps=DBSCAN_EPS_DEG, min_samples=DBSCAN_MIN_SAMPLES, metric="euclidean")
        labels = db.fit_predict(coords)

        # Check if the latest point belongs to a cluster (label ≥ 0)
        latest_label = int(labels[-1])
        cluster_found = latest_label >= 0
        n_clusters = len(set(labels) - {-1})

        cluster_score = 0.0
        if cluster_found:
            cluster_size = int(np.sum(labels == latest_label))
            cluster_score = min(cluster_size * 5.0, 30.0)

        return {
            "cluster_detected": cluster_found,
            "cluster_label": latest_label if cluster_found else None,
            "total_clusters": n_clusters,
            "points_analysed": len(history),
            "score": cluster_score,
        }
    except Exception as exc:
        logger.warning("DBSCAN clustering failed: %s", exc)
        return {
            "cluster_detected": False,
            "points_analysed": len(history),
            "score": 0.0,
            "detail": f"Clustering error: {exc}",
        }


# ── Layer 3: Geofence polygon ───────────────────────────────────────

def _layer3_geofence(
    lat: float, lon: float, geofence: Optional[GeofencePolygon]
) -> Dict[str, Any]:
    """Check point-in-polygon for the supplied geofence."""
    if geofence is None or len(geofence.vertices) < 3:
        return {"checked": False, "inside": None, "score": 0.0}

    polygon = [(v.latitude, v.longitude) for v in geofence.vertices]
    inside = _point_in_polygon(lat, lon, polygon)

    score = 0.0 if inside else 20.0

    return {
        "checked": True,
        "inside": inside,
        "score": score,
    }


# ── Aggregate decision ──────────────────────────────────────────────

def _aggregate(
    l1: Dict[str, Any], l2: Dict[str, Any], l3: Dict[str, Any]
) -> Dict[str, Any]:
    """Combine layer scores into a 0–100 anomaly score and decision."""
    total = min(l1["score"] + l2["score"] + l3["score"], 100.0)
    total = round(total, 2)

    if total <= 30:
        decision = "ACCEPT"
    elif total <= 60:
        decision = "FLAG_FOR_REVIEW"
    else:
        decision = "REJECT"

    return {
        "anomaly_score": total,
        "decision": decision,
        "layer_scores": {
            "rule_based": round(l1["score"], 2),
            "dbscan_cluster": round(l2["score"], 2),
            "geofence": round(l3["score"], 2),
        },
    }


# ── FastAPI endpoint ─────────────────────────────────────────────────

@router.post("/gps-anomaly-check")
async def check_gps_anomaly(request: GpsAnomalyRequest) -> Dict[str, Any]:
    """
    Run 3-layer GPS anomaly detection on the supplied coordinates and
    return an anomaly score with accept/flag/reject decision.
    """
    lat = request.coordinates.latitude
    lon = request.coordinates.longitude

    try:
        l1 = _layer1_rules(request)
        l2 = _layer2_dbscan(request.user_id, lat, lon)
        l3 = _layer3_geofence(lat, lon, request.geofence)
        decision = _aggregate(l1, l2, l3)
    except Exception as exc:
        logger.exception("GPS anomaly check failed")
        raise HTTPException(status_code=500, detail="Analysis error") from exc

    # Persist coordinate for future clustering
    with _lock:
        _coord_store[request.user_id].append((lat, lon))

    return {
        "success": True,
        "user_id": request.user_id,
        "plantation_id": request.plantation_id,
        "coordinates": {"latitude": lat, "longitude": lon},
        "anomaly_detection": {
            "anomaly_score": decision["anomaly_score"],
            "decision": decision["decision"],
            "layer_scores": decision["layer_scores"],
            "layer1_rules": l1,
            "layer2_dbscan": l2,
            "layer3_geofence": l3,
        },
        "ai_model_version": "1.0.0-rules+dbscan",
    }


# ── Admin utility endpoint ──────────────────────────────────────────

@router.get("/gps-anomaly-check/stats")
async def gps_stats() -> Dict[str, Any]:
    """Return coordinate-store statistics (admin / debug use)."""
    with _lock:
        user_count = len(_coord_store)
        total_coords = sum(len(v) for v in _coord_store.values())

    return {
        "success": True,
        "users_tracked": user_count,
        "total_coordinates_stored": total_coords,
    }
