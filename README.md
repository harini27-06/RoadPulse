# RoadWatch — AI Road Monitoring Platform

AI-powered road defect detection and complaint management system.

## Architecture

```
roadwatch-next/    ← Next.js 15 frontend + API routes + PostgreSQL
roadwatch-yolo/    ← FastAPI + YOLOv11 detection service
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ with PostGIS extension
- pip

---

## 1. Database Setup

```sql
-- In psql
CREATE DATABASE roadwatch;
\c roadwatch
CREATE EXTENSION postgis;
```

---

## 2. Next.js Setup

```bash
cd roadwatch-next
npm install
```

Edit `.env.local`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/roadwatch?schema=public"
YOLO_SERVICE_URL="http://localhost:8000"
```

Run migrations and generate Prisma client:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start development server:
```bash
npm run dev
```

App runs at: http://localhost:3000

---

## 3. YOLO Service Setup

```bash
cd roadwatch-yolo
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Service runs at: http://localhost:8000

### Custom Model (Optional)
Place your trained YOLOv11 model at `roadwatch-yolo/models/yolov11_road.pt`

Classes must be: Pothole, Crack, Waterlogging, Debris, Damaged Road, Missing Manhole

Without a custom model, the service runs in demo mode using the base YOLOv11 model.

---

## Features

- **Chatbot** — Road Q&A with local knowledge base (no external API)
- **Image Upload** — YOLO detects road defects with confidence scores
- **Complaint Flow** — GPS/manual location → description → complaint stored
- **Complaints Page** — View all filed complaints with status badges
- **Dark/Light Mode** — Full theme support
- **Responsive** — Mobile-first design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Framer Motion |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL + PostGIS |
| AI Service | FastAPI, YOLOv11, OpenCV, Ultralytics |
| Maps | Leaflet, OpenStreetMap + Nominatim |
