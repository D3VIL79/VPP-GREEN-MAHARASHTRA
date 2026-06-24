"""
VPP Green Maharashtra -- Species Recognition Engine
====================================================
CNN-based species identification from uploaded tree photos using a
trained ResNet-18 model (33 output classes).

The model checkpoint (species_cnn.pth) is loaded once at module-import
time and kept on GPU if available.

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
from fastapi import APIRouter, File, HTTPException, UploadFile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["Species Recognition"])

# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------
NUM_CLASSES = 33

CLASS_NAMES: List[str] = [
    "Ashoka", "Banyan", "Gulmohar", "Jamun", "Mango",
    "Neem", "Peepal", "amla", "asopalav", "babul",
    "bamboo", "bili", "cactus", "champa", "coconut",
    "garmalo", "gulmohor", "gunda", "kanchan", "kesudo",
    "khajur", "motichanoti", "nilgiri", "other", "pilikaren",
    "pipal", "saptaparni", "shirish", "simlo", "sitafal",
    "sonmahor", "sugarcane", "vad",
]

# ---------------------------------------------------------------------------
# Species metadata -- maps class name -> scientific name + CO2 data
# ---------------------------------------------------------------------------
SPECIES_METADATA: Dict[str, Dict[str, Any]] = {
    "Ashoka": {
        "scientific_name": "Saraca asoca",
        "co2_kg_yr": 15.0,
        "native_to_maharashtra": True,
        "description": "Pendulous young red leaves, orange-yellow flower clusters.",
    },
    "Banyan": {
        "scientific_name": "Ficus benghalensis",
        "co2_kg_yr": 28.5,
        "native_to_maharashtra": True,
        "description": "Massive aerial roots, large dark-green leathery leaves.",
    },
    "Gulmohar": {
        "scientific_name": "Delonix regia",
        "co2_kg_yr": 18.0,
        "native_to_maharashtra": False,
        "description": "Fern-like foliage with brilliant scarlet-red flowers.",
    },
    "Jamun": {
        "scientific_name": "Syzygium cumini",
        "co2_kg_yr": 19.5,
        "native_to_maharashtra": True,
        "description": "Dense glossy foliage, dark purple fruit clusters.",
    },
    "Mango": {
        "scientific_name": "Mangifera indica",
        "co2_kg_yr": 20.0,
        "native_to_maharashtra": True,
        "description": "Glossy dark-green lance-shaped leaves, yellowish inflorescence.",
    },
    "Neem": {
        "scientific_name": "Azadirachta indica",
        "co2_kg_yr": 22.6,
        "native_to_maharashtra": True,
        "description": "Dense, spreading canopy with small serrated leaves.",
    },
    "Peepal": {
        "scientific_name": "Ficus religiosa",
        "co2_kg_yr": 26.0,
        "native_to_maharashtra": True,
        "description": "Heart-shaped leaves with elongated drip-tips.",
    },
    "amla": {
        "scientific_name": "Phyllanthus emblica",
        "co2_kg_yr": 14.0,
        "native_to_maharashtra": True,
        "description": "Small deciduous tree with feathery pinnate leaves.",
    },
    "asopalav": {
        "scientific_name": "Polyalthia longifolia",
        "co2_kg_yr": 16.5,
        "native_to_maharashtra": True,
        "description": "Tall columnar tree with long pendulous leaves.",
    },
    "babul": {
        "scientific_name": "Vachellia nilotica",
        "co2_kg_yr": 13.0,
        "native_to_maharashtra": True,
        "description": "Thorny tree with bipinnate leaves and yellow flower balls.",
    },
    "bamboo": {
        "scientific_name": "Bambusoideae spp.",
        "co2_kg_yr": 12.0,
        "native_to_maharashtra": True,
        "description": "Fast-growing woody grass with hollow segmented stems.",
    },
    "bili": {
        "scientific_name": "Aegle marmelos",
        "co2_kg_yr": 10.0,
        "native_to_maharashtra": True,
        "description": "Sacred tree with trifoliate aromatic leaves.",
    },
    "cactus": {
        "scientific_name": "Cactaceae spp.",
        "co2_kg_yr": 2.0,
        "native_to_maharashtra": False,
        "description": "Succulent plant adapted to arid conditions.",
    },
    "champa": {
        "scientific_name": "Magnolia champaca",
        "co2_kg_yr": 14.5,
        "native_to_maharashtra": True,
        "description": "Fragrant yellow-orange flowers, glossy evergreen leaves.",
    },
    "coconut": {
        "scientific_name": "Cocos nucifera",
        "co2_kg_yr": 12.0,
        "native_to_maharashtra": True,
        "description": "Tall unbranched trunk with a crown of large pinnate fronds.",
    },
    "garmalo": {
        "scientific_name": "Cassia fistula",
        "co2_kg_yr": 15.0,
        "native_to_maharashtra": True,
        "description": "Golden shower tree with pendulous yellow flower racemes.",
    },
    "gulmohor": {
        "scientific_name": "Delonix regia",
        "co2_kg_yr": 18.0,
        "native_to_maharashtra": False,
        "description": "Variant spelling of Gulmohar; flame-red flowers.",
    },
    "gunda": {
        "scientific_name": "Cordia myxa",
        "co2_kg_yr": 10.0,
        "native_to_maharashtra": True,
        "description": "Small deciduous tree yielding mucilaginous fruit.",
    },
    "kanchan": {
        "scientific_name": "Bauhinia variegata",
        "co2_kg_yr": 13.5,
        "native_to_maharashtra": True,
        "description": "Orchid-like pink-white flowers, bilobed leaves.",
    },
    "kesudo": {
        "scientific_name": "Butea monosperma",
        "co2_kg_yr": 14.0,
        "native_to_maharashtra": True,
        "description": "Flame of the forest; brilliant orange-red blooms.",
    },
    "khajur": {
        "scientific_name": "Phoenix dactylifera",
        "co2_kg_yr": 11.0,
        "native_to_maharashtra": False,
        "description": "Date palm with long arching pinnate fronds.",
    },
    "motichanoti": {
        "scientific_name": "Plumeria rubra",
        "co2_kg_yr": 8.0,
        "native_to_maharashtra": False,
        "description": "Frangipani tree with fragrant waxy flowers.",
    },
    "nilgiri": {
        "scientific_name": "Eucalyptus globulus",
        "co2_kg_yr": 20.0,
        "native_to_maharashtra": False,
        "description": "Tall aromatic tree with peeling bark and lance leaves.",
    },
    "other": {
        "scientific_name": "Unknown",
        "co2_kg_yr": 10.0,
        "native_to_maharashtra": False,
        "description": "Species not in the current recognition database.",
    },
    "pilikaren": {
        "scientific_name": "Nerium oleander",
        "co2_kg_yr": 5.0,
        "native_to_maharashtra": True,
        "description": "Evergreen shrub with clusters of pink or white flowers.",
    },
    "pipal": {
        "scientific_name": "Ficus religiosa",
        "co2_kg_yr": 26.0,
        "native_to_maharashtra": True,
        "description": "Sacred fig with heart-shaped leaves (alternate spelling).",
    },
    "saptaparni": {
        "scientific_name": "Alstonia scholaris",
        "co2_kg_yr": 18.0,
        "native_to_maharashtra": True,
        "description": "Tall evergreen with whorled leaves and fragrant flowers.",
    },
    "shirish": {
        "scientific_name": "Albizia lebbeck",
        "co2_kg_yr": 16.0,
        "native_to_maharashtra": True,
        "description": "Spreading canopy, bipinnate leaves, rattling pods.",
    },
    "simlo": {
        "scientific_name": "Bombax ceiba",
        "co2_kg_yr": 17.0,
        "native_to_maharashtra": True,
        "description": "Tall deciduous tree with large red flowers and thorny trunk.",
    },
    "sitafal": {
        "scientific_name": "Annona squamosa",
        "co2_kg_yr": 8.0,
        "native_to_maharashtra": True,
        "description": "Small tree bearing scaly custard-apple fruit.",
    },
    "sonmahor": {
        "scientific_name": "Cassia siamea",
        "co2_kg_yr": 14.0,
        "native_to_maharashtra": False,
        "description": "Yellow-flowered ornamental tree with pinnate leaves.",
    },
    "sugarcane": {
        "scientific_name": "Saccharum officinarum",
        "co2_kg_yr": 6.0,
        "native_to_maharashtra": True,
        "description": "Tall perennial grass cultivated for its sweet stalks.",
    },
    "vad": {
        "scientific_name": "Ficus benghalensis",
        "co2_kg_yr": 28.5,
        "native_to_maharashtra": True,
        "description": "Gujarati name for the Banyan; vast aerial root system.",
    },
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
    """Try primary and fallback paths for the species checkpoint."""
    primary = (
        Path(__file__).resolve().parent.parent.parent
        / "vpp-green" / "ai-backend" / "models" / "species_cnn.pth"
    )
    fallback = (
        Path(__file__).resolve().parent.parent / "models" / "species_cnn.pth"
    )

    if primary.is_file():
        return primary
    if fallback.is_file():
        return fallback

    raise FileNotFoundError(
        f"species_cnn.pth not found at:\n  {primary}\n  {fallback}"
    )


def _load_model() -> nn.Module:
    """Load the trained species recognition model onto DEVICE."""
    model_path = _resolve_model_path()
    logger.info("Loading species model from %s onto %s", model_path, DEVICE)

    model = _build_resnet18(NUM_CLASSES)
    state_dict = torch.load(model_path, map_location=DEVICE, weights_only=True)
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()

    logger.info("Species model loaded successfully (%d classes)", NUM_CLASSES)
    return model


# Module-level model load -- happens once on first import
try:
    _model = _load_model()
except Exception:
    logger.exception("FAILED to load species recognition model at startup")
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


# ---------------------------------------------------------------------------
# Inference helper
# ---------------------------------------------------------------------------

def _predict(tensor: torch.Tensor, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Run forward pass and return top-N predictions with softmax scores.
    """
    if _model is None:
        raise RuntimeError("Species model is not loaded")

    with torch.no_grad():
        logits = _model(tensor)  # (1, NUM_CLASSES)
        probs = F.softmax(logits, dim=1).squeeze(0)  # (NUM_CLASSES,)

    top_probs, top_indices = torch.topk(probs, k=min(top_n, NUM_CLASSES))

    results: List[Dict[str, Any]] = []
    for prob, idx in zip(top_probs.tolist(), top_indices.tolist()):
        class_name = CLASS_NAMES[idx]
        meta = SPECIES_METADATA.get(class_name, {})
        results.append({
            "species_name": class_name,
            "scientific_name": meta.get("scientific_name", "Unknown"),
            "confidence": round(prob, 4),
            "average_co2_absorption_kg_per_year": meta.get("co2_kg_yr", 0.0),
            "native_to_maharashtra": meta.get("native_to_maharashtra", False),
            "description": meta.get("description", ""),
        })

    return results


# ---------------------------------------------------------------------------
# FastAPI endpoint
# ---------------------------------------------------------------------------

@router.post("/species-recognition")
async def recognize_species(
    image: UploadFile = File(..., description="Photo of the tree"),
) -> Dict[str, Any]:
    """
    Upload a tree photo to receive CNN-based species identification
    along with alternative matches and ecological metadata.
    """
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Expected an image file")

    raw = await image.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 15 MB limit")

    try:
        tensor = _prepare_image(raw)
        matches = _predict(tensor, top_n=5)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Model not available: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Species recognition model is not loaded",
        ) from exc
    except Exception as exc:
        logger.exception("Species recognition failed")
        raise HTTPException(status_code=500, detail="Analysis error") from exc

    top = matches[0]

    return {
        "success": True,
        "recognized_species": {
            "species_name": top["species_name"],
            "scientific_name": top["scientific_name"],
            "confidence": top["confidence"],
            "source": "resnet18_cnn",
            "average_co2_absorption_kg_per_year": top["average_co2_absorption_kg_per_year"],
            "native_to_maharashtra": top["native_to_maharashtra"],
            "description": top["description"],
        },
        "alternative_matches": matches[1:],
        "ai_model_version": "2.0.0-resnet18-trained",
    }
