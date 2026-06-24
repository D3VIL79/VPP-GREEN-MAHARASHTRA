"""
VPP Green Maharashtra — Duplicate Photo Detection Engine
=========================================================
Detects duplicate or near-duplicate tree photos using **perceptual
hashing** (pHash) from the ``imagehash`` library.

Algorithm
---------
1. Compute the 64-bit perceptual hash (pHash) of the uploaded image.
2. Look up the user's previously stored hashes from an in-memory store.
3. Compute Hamming distance between the new hash and every stored hash.
4. Apply thresholds:
       distance <  10  →  DUPLICATE   (high confidence)
       distance 10–15  →  SUSPICIOUS  (medium confidence)
       distance >  15  →  UNIQUE      (low risk)
5. Store the new hash for future comparisons.

The in-memory hash store resets on server restart.  In production this
would be backed by Redis or a database.

Author : VPP AI Team
Version: 1.0.0-phash
"""

from __future__ import annotations

import io
import logging
import threading
from collections import defaultdict
from typing import Any, Dict, List, Optional

import imagehash
from PIL import Image
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["Duplicate Detection"])

# ── Thread-safe in-memory hash store ─────────────────────────────────
# Maps user_id → list of (hash, plantation_id, filename)

_lock = threading.Lock()
_hash_store: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

# ── Thresholds ───────────────────────────────────────────────────────
DUPLICATE_THRESHOLD = 10
SUSPICIOUS_THRESHOLD = 15


# ── Helpers ──────────────────────────────────────────────────────────

def _compute_phash(raw_bytes: bytes, hash_size: int = 8) -> imagehash.ImageHash:
    """Compute a perceptual hash from raw image bytes."""
    try:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc
    return imagehash.phash(img, hash_size=hash_size)


def _compute_ahash(raw_bytes: bytes, hash_size: int = 8) -> imagehash.ImageHash:
    """Average hash — used as a secondary signal."""
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    return imagehash.average_hash(img, hash_size=hash_size)


def _hamming(h1: imagehash.ImageHash, h2: imagehash.ImageHash) -> int:
    """Hamming distance between two hashes."""
    return int(h1 - h2)


def _classify_distance(distance: int) -> str:
    """Map Hamming distance to verdict label."""
    if distance < DUPLICATE_THRESHOLD:
        return "DUPLICATE"
    elif distance <= SUSPICIOUS_THRESHOLD:
        return "SUSPICIOUS"
    return "UNIQUE"


def _confidence_from_distance(distance: int) -> float:
    """Convert Hamming distance to a 0–1 confidence of duplication."""
    if distance == 0:
        return 1.0
    if distance >= 30:
        return 0.0
    return round(max(1.0 - distance / 30.0, 0.0), 4)


# ── Core comparison ──────────────────────────────────────────────────

def _check_against_store(
    user_id: str,
    new_phash: imagehash.ImageHash,
    new_ahash: imagehash.ImageHash,
) -> Dict[str, Any]:
    """
    Compare new hash against all stored hashes for this user.

    Returns the closest match info or a UNIQUE verdict.
    """
    with _lock:
        store = _hash_store.get(user_id, [])

    if not store:
        return {
            "verdict": "UNIQUE",
            "closest_distance": None,
            "closest_plantation_id": None,
            "closest_filename": None,
            "confidence": 0.0,
            "comparisons_made": 0,
        }

    best_dist = 999
    best_entry: Optional[Dict[str, Any]] = None

    for entry in store:
        stored_phash = entry["phash"]
        d = _hamming(new_phash, stored_phash)
        if d < best_dist:
            best_dist = d
            best_entry = entry

        # Also check ahash for extra confidence
        stored_ahash = entry.get("ahash")
        if stored_ahash is not None:
            d_a = _hamming(new_ahash, stored_ahash)
            combined = min(d, d_a)
            if combined < best_dist:
                best_dist = combined
                best_entry = entry

    verdict = _classify_distance(best_dist)
    confidence = _confidence_from_distance(best_dist)

    return {
        "verdict": verdict,
        "closest_distance": best_dist,
        "closest_plantation_id": best_entry["plantation_id"] if best_entry else None,
        "closest_filename": best_entry["filename"] if best_entry else None,
        "confidence": confidence,
        "comparisons_made": len(store),
    }


def _store_hash(
    user_id: str,
    phash: imagehash.ImageHash,
    ahash: imagehash.ImageHash,
    plantation_id: str,
    filename: str,
) -> int:
    """Persist hash to in-memory store. Returns new count for user."""
    entry = {
        "phash": phash,
        "ahash": ahash,
        "plantation_id": plantation_id,
        "filename": filename,
    }
    with _lock:
        _hash_store[user_id].append(entry)
        return len(_hash_store[user_id])


# ── FastAPI endpoint ─────────────────────────────────────────────────

@router.post("/duplicate-check")
async def check_duplicate(
    image: UploadFile = File(..., description="Tree photo to check"),
    user_id: str = Form("anonymous"),
    plantation_id: str = Form("unknown"),
) -> Dict[str, Any]:
    """
    Check whether an uploaded photo is a duplicate of a previously
    submitted image (per user).  The image hash is stored after
    comparison so future uploads are checked against it.
    """
    # ── Validate ─────────────────────────────────────────────────
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Expected an image file")

    raw = await image.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 15 MB limit")

    # ── Compute hashes ───────────────────────────────────────────
    try:
        phash = _compute_phash(raw)
        ahash = _compute_ahash(raw)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # ── Compare ──────────────────────────────────────────────────
    result = _check_against_store(user_id, phash, ahash)

    # ── Store for future checks ──────────────────────────────────
    total_stored = _store_hash(
        user_id, phash, ahash, plantation_id, image.filename or "upload"
    )

    return {
        "success": True,
        "user_id": user_id,
        "plantation_id": plantation_id,
        "duplicate_check": {
            "verdict": result["verdict"],
            "confidence": result["confidence"],
            "hamming_distance": result["closest_distance"],
            "matched_plantation_id": result["closest_plantation_id"],
            "matched_filename": result["closest_filename"],
            "comparisons_made": result["comparisons_made"],
            "threshold_duplicate": DUPLICATE_THRESHOLD,
            "threshold_suspicious": SUSPICIOUS_THRESHOLD,
        },
        "store_info": {
            "hash_stored": True,
            "total_hashes_for_user": total_stored,
        },
        "ai_model_version": "1.0.0-phash",
    }


# ── Admin utility endpoint ──────────────────────────────────────────

@router.get("/duplicate-check/stats")
async def duplicate_stats() -> Dict[str, Any]:
    """Return hash-store statistics (admin / debug use)."""
    with _lock:
        user_count = len(_hash_store)
        total_hashes = sum(len(v) for v in _hash_store.values())

    return {
        "success": True,
        "users_tracked": user_count,
        "total_hashes_stored": total_hashes,
    }
