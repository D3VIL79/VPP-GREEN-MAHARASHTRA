"""
VPP Green Maharashtra -- Tree Health Detection Engine
=====================================================
CNN-based tree health classification from uploaded images using a
trained ResNet-18 model (4 output classes).

The model checkpoint (health_cnn.pth) is loaded once at module-import
time and kept on GPU if available.

Classes (alphabetical, as PyTorch ImageFolder sorts them):
  Healthy, Mild_Stress, Moderate_Stress, Severe_Stress

Preprocessing mirrors torchvision ImageNet defaults:
  - Resize to 224x224
  - Normalize with mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]

Author : VPP AI Team
Version: 2.0.0-resnet18-trained
"""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["Tree Health"])

# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------
NUM_CLASSES = 4

CLASS_NAMES: List[str] = [
    "Healthy",
    "Mild_Stress",
    "Moderate_Stress",
    "Severe_Stress",
]

# Map internal class names to user-friendly API labels
STATUS_LABELS: Dict[str, str] = {
    "Healthy": "Healthy",
    "Mild_Stress": "Mild Stress",
    "Moderate_Stress": "Moderate Stress",
    "Severe_Stress": "Severe Stress",
}

# ---------------------------------------------------------------------------
# Remedy knowledge-base
# ---------------------------------------------------------------------------
REMEDIES: Dict[str, str] = {
    "Healthy": (
        "Tree is in good health. Continue regular watering and periodic "
        "mulching. Monitor for pest activity during monsoon season."
    ),
    "Mild_Stress": (
        "Minor stress indicators detected. Recommend increased watering "
        "frequency, light pruning of affected branches, and application "
        "of balanced NPK fertiliser. Monitor weekly for progression."
    ),
    "Moderate_Stress": (
        "Significant stress observed. Recommend soil testing, application "
        "of organic fertiliser, pest/disease inspection, and ensuring "
        "proper drainage. Consider consulting an arborist if symptoms persist."
    ),
    "Severe_Stress": (
        "Tree shows severe decline. Inspect root zone for water-logging or "
        "termite damage. Immediate intervention required -- consider "
        "professional arborist assessment. If irrecoverable, replace with "
        "a hardy native species and treat surrounding soil before replanting."
    ),
}

# ---------------------------------------------------------------------------
# Build and load the ResNet-18 model
# ---------------------------------------------------------------------------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _build_resnet18(num_classes: int) -> nn.Module:
    """Construct a ResNet-18 with a custom final FC layer."""
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def _resolve_model_path() -> Path:
    """Try primary and fallback paths for the health checkpoint."""
    primary = (
        Path(__file__).resolve().parent.parent.parent
        / "vpp-green" / "ai-backend" / "models" / "health_cnn.pth"
    )
    fallback = (
        Path(__file__).resolve().parent.parent / "models" / "health_cnn.pth"
    )

    if primary.is_file():
        return primary
    if fallback.is_file():
        return fallback

    raise FileNotFoundError(
        f"health_cnn.pth not found at:\n  {primary}\n  {fallback}"
    )


def _load_model() -> nn.Module:
    """Load the trained tree health model onto DEVICE."""
    model_path = _resolve_model_path()
    logger.info("Loading health model from %s onto %s", model_path, DEVICE)

    model = _build_resnet18(NUM_CLASSES)
    state_dict = torch.load(model_path, map_location=DEVICE, weights_only=True)
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()

    logger.info("Health model loaded successfully (%d classes)", NUM_CLASSES)
    return model


# Module-level model load -- happens once on first import
try:
    _model = _load_model()
except Exception:
    logger.exception("FAILED to load tree health model at startup")
    _model = None

# ---------------------------------------------------------------------------
# Image preprocessing (matches training pipeline)
# ---------------------------------------------------------------------------
_preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def _prepare_image(raw_bytes: bytes) -> torch.Tensor:
    """Decode raw bytes -> preprocessed 4-D tensor on DEVICE."""
    try:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc

    tensor = _preprocess(img)  # (3, 224, 224)
    return tensor.unsqueeze(0).to(DEVICE)  # (1, 3, 224, 224)


def _compute_analysis_metrics(raw_bytes: bytes) -> Dict[str, Any]:
    """
    Compute lightweight image statistics for the response payload.
    These are informational only -- the CNN does the real classification.
    """
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    arr = np.asarray(img, dtype=np.float64)

    mean_r = float(np.mean(arr[:, :, 0]))
    mean_g = float(np.mean(arr[:, :, 1]))
    mean_b = float(np.mean(arr[:, :, 2]))
    channel_sum = mean_r + mean_g + mean_b

    green_ratio = mean_g / channel_sum if channel_sum > 0 else 0.0
    brightness = float(np.mean(arr) / 255.0)
    color_variance = float(np.var(arr / 255.0))

    return {
        "green_ratio": round(green_ratio, 4),
        "brightness": round(brightness, 4),
        "color_variance": round(color_variance, 6),
        "image_resolution": f"{arr.shape[1]}x{arr.shape[0]}",
    }


# ---------------------------------------------------------------------------
# Inference helper
# ---------------------------------------------------------------------------

def _predict(tensor: torch.Tensor) -> Dict[str, Any]:
    """
    Run forward pass and return predicted class + full confidence dict.
    """
    if _model is None:
        raise RuntimeError("Health model is not loaded")

    with torch.no_grad():
        logits = _model(tensor)  # (1, NUM_CLASSES)
        probs = F.softmax(logits, dim=1).squeeze(0)  # (NUM_CLASSES,)

    # Build confidence dict with user-friendly labels
    confidence: Dict[str, float] = {}
    for i, class_name in enumerate(CLASS_NAMES):
        label = STATUS_LABELS[class_name]
        confidence[label] = round(probs[i].item(), 4)

    # Predicted class = argmax
    pred_idx = int(torch.argmax(probs).item())
    pred_class = CLASS_NAMES[pred_idx]

    return {
        "status": pred_class,
        "status_label": STATUS_LABELS[pred_class],
        "confidence": confidence,
    }


# ---------------------------------------------------------------------------
# FastAPI endpoint
# ---------------------------------------------------------------------------

@router.post("/tree-health")
async def analyze_tree_health(
    image: UploadFile = File(..., description="Photo of the tree"),
    plantation_id: str = Form("unknown"),
) -> Dict[str, Any]:
    """
    Analyse an uploaded tree photo and return CNN-based health
    classification, confidence scores, analysis metrics, and a
    remedy suggestion.
    """
    # --- validate upload ---
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Expected an image file, got {image.content_type}",
        )

    raw = await image.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 15 MB limit")

    # --- run CNN inference ---
    try:
        tensor = _prepare_image(raw)
        result = _predict(tensor)
        metrics = _compute_analysis_metrics(raw)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Model not available: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Tree health model is not loaded",
        ) from exc
    except Exception as exc:
        logger.exception("Tree-health analysis failed")
        raise HTTPException(status_code=500, detail="Analysis error") from exc

    status_key = result["status"]

    return {
        "success": True,
        "plantation_id": plantation_id,
        "health_status": result["status_label"],
        "confidence": result["confidence"],
        "remedy_suggestion": REMEDIES[status_key],
        "analysis_metrics": metrics,
        "ai_model_version": "2.0.0-resnet18-trained",
    }
