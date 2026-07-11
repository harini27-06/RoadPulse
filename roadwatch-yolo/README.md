# RoadWatch YOLO Service

FastAPI + YOLOv11 road defect detection service.

## Model

**One model. One path.**

```
roadwatch-yolo/models/yolov11_road.pt   ← YOUR trained road model
```

### Detection Pipeline

```
Upload image
    │
    ▼
YOLOv11 (models/yolov11_road.pt)
    │
    ├── Detection found → return issue + confidence
    │
    └── No detection → CLIP zero-shot fallback
            │
            ├── Road image → classify defect type
            └── Not a road → reject (returns "Not a Road")
```

### Classes

| ID | Class |
|----|-------|
| 0 | Pothole |
| 1 | Crack |
| 2 | Waterlogging |
| 3 | Debris |
| 4 | Damaged Road |
| 5 | Missing Manhole |
| 6 | Good Road |

---

## Setup

```bash
pip install -r requirements.txt
```

## Train Your Model

```bash
# Step 1 — Prepare dataset
python prepare_dataset.py

# Step 2 — Train (saves to models/yolov11_road.pt)
python train.py
```

## Run Service

```bash
uvicorn main:app --reload --port 8000
```

Service runs at: http://localhost:8000

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |

---

## API

### `POST /upload`
Upload a road image for defect detection.

**Response:**
```json
{
  "issue": "Pothole",
  "confidence": 87.3
}
```

### `GET /health`
```json
{
  "status": "ok",
  "model": "models/yolov11_road.pt",
  "model_loaded": true,
  "model_exists": true,
  "clip_loaded": true
}
```
