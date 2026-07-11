"""
RoadWatch YOLO Classification Service
---------------------------------------
Model: models/yolov11_road.pt  (YOLOv11 classification)

Classes trained:
  Pothole      → raise complaint
  Crack        → raise complaint
  Waterlogging → raise complaint
  Good Road    → good condition, no complaint
  Not a Road   → reject, ask for road image

Train: python train.py
Run:   uvicorn main:app --reload --port 8000
"""

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(title="RoadWatch YOLO Service", version="5.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

UPLOAD_DIR    = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_PATH    = Path("models/yolov11_road.pt")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Map model class names → canonical RoadWatch names
# Handles both folder-name style and display-name style
CLASS_NAME_MAP = {
    "pothole":      "Pothole",
    "crack":        "Crack",
    "waterlog":     "Waterlogging",
    "waterlogging": "Waterlogging",
    "goodroad":     "Good Road",
    "good road":    "Good Road",
    "good_road":    "Good Road",
    "noroad":       "Not a Road",
    "not a road":   "Not a Road",
    "not_a_road":   "Not a Road",
}

# Classes that should trigger a complaint flow
COMPLAINT_CLASSES = {"Pothole", "Crack", "Waterlogging", "Damaged Road", "Debris", "Missing Manhole"}

_model: Optional[YOLO] = None


def load_model() -> YOLO:
    global _model
    if _model is not None:
        return _model
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Model not found at {MODEL_PATH}. Run 'python train.py' first."
        )
    _model = YOLO(str(MODEL_PATH))
    print(f"✅ Loaded model: {MODEL_PATH}")
    return _model


def normalize_class(raw: str) -> str:
    """Map raw model class name → canonical RoadWatch class name."""
    return CLASS_NAME_MAP.get(raw.lower().strip(), raw)


@app.on_event("startup")
async def startup():
    try:
        load_model()
    except RuntimeError as e:
        print(f"⚠️  {e}")


class DetectionResponse(BaseModel):
    issue: str
    confidence: float


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": str(MODEL_PATH),
        "model_loaded": _model is not None,
        "model_exists": MODEL_PATH.exists(),
    }


@app.post("/upload", response_model=DetectionResponse)
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size must be under 10 MB")

    ext = Path(file.filename or "image.jpg").suffix or ".jpg"
    file_path = UPLOAD_DIR / f"{uuid.uuid4()}{ext}"

    try:
        file_path.write_bytes(contents)

        try:
            model = load_model()
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))

        results = model(str(file_path), verbose=False)

        if not results or results[0].probs is None:
            raise HTTPException(status_code=500, detail="Model returned no results")

        probs   = results[0].probs
        top_idx = int(probs.top1)
        top_conf = float(probs.top1conf)

        raw_class    = model.names[top_idx]
        issue        = normalize_class(raw_class)
        confidence   = round(top_conf * 100, 1)

        return DetectionResponse(issue=issue, confidence=confidence)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    finally:
        if file_path.exists():
            file_path.unlink()
