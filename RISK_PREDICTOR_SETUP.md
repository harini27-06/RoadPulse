# Risk Predictor - Setup & Deployment Guide

## Quick Start

### 1. Install Dependencies
```bash
cd roadwatch-next
npm install
```

Ensure these packages are installed (already in package.json):
- `react-leaflet@^4.2.1`
- `leaflet@^1.9.4`

### 2. Database Migration
Run the migration to create the RoadRiskPrediction table:
```bash
npm run db:migrate
```

This will:
- Create `road_risk_predictions` table
- Add relationship to Road model
- Enable caching of predictions

### 3. Run the Application

**Terminal 1 - Next.js Dev Server:**
```bash
cd roadwatch-next
npm run dev
```
Server runs on: http://localhost:3000

**Terminal 2 - Python ML Service (optional):**
```bash
cd roadwatch-yolo
python main.py
```
FastAPI runs on: http://localhost:8000

### 4. Access Risk Predictor
Navigate to: http://localhost:3000/risk-predictor

## Features

### Interactive Map
- **View**: All roads color-coded by risk level
- **Click**: Select a road to see detailed breakdown
- **Filter**: Filter by urgency level (Critical, High, Medium, Low)
- **Legend**: Shows risk percentage ranges and circle sizing

### Risk Breakdown Panel
When you click on a road marker:
- **Overall Risk**: 0-100% score with urgency badge
- **Confidence**: How reliable the prediction is (0-100%)
- **Breakdown**: Risk contribution by each factor
  - Image Analysis (40%)
  - Accident Impact (40%)
  - Complaint Impact (40%)
  - Temporal Impact (20%)
- **Contributing Factors**: Detailed metrics affecting the score

### Statistics Dashboard
- **Total Roads**: All roads under surveillance
- **Critical Risks**: Roads with risk ≥ 80%
- **High Risk**: Roads with risk 60-79%
- **Average Risk**: Network-wide risk percentage
- **Alert**: Highest risk road highlighted

## How It Works

### Risk Calculation (Hybrid ML)

**Layer 1: Image Analysis (40%)**
- Analyzes road defects from complaint images using YOLO
- Calculates defect density (% of image with defects)
- Determines max severity from detected defects
- Formula: (density × 0.6) + (max_severity × 0.4)

**Layer 2: Statistical Analysis (40%)**
- Historical accidents in the road's district
- Number and severity of complaints
- Average complaint severity score
- Formula: (accidents × 0.4) + (complaints × 0.4) + (severity × 0.2)

**Layer 3: Temporal Trends (20%)**
- Complaint trend (increasing or decreasing)
- Recency (how recent complaints are)
- Seasonal adjustments (monsoon, etc.)
- Formula: (recency × 0.6) + (trend × 0.4) × seasonal_factor

**Final Score:**
```
Risk = (Image × 0.4) + (Statistical × 0.4) + (Temporal × 0.2)
```

### Urgency Levels
- 🔴 **Critical**: Risk ≥ 80% - Immediate action required
- 🟠 **High**: Risk 60-79% - Urgent attention needed
- 🟡 **Medium**: Risk 40-59% - Monitor closely
- 🟢 **Low**: Risk < 40% - Normal monitoring

## API Endpoints

### Calculate Risk for Single Road
```bash
POST /api/risk/calculate
Content-Type: application/json

{
  "roadId": "cuid_of_road"
}

Response:
{
  "road_id": "...",
  "road_name": "Pollachi road",
  "district": "Coimbatore",
  "risk_percentage": 76,
  "urgency": "High",
  "confidence": 85,
  "breakdown": {
    "image_analysis": 45,
    "accident_impact": 82,
    "complaint_impact": 68,
    "temporal_impact": 23
  },
  "factors": {
    "defect_density": 45,
    "defect_severity": 65,
    "defect_types": {},
    "critical_complaints": "23%",
    "trend": "increasing",
    "days_since_complaint": 12
  }
}
```

### Get Map Data (All Roads)
```bash
GET /api/risk/map-data

Response: Array of roads with:
- id, road_name, district
- risk_percentage, urgency, confidence
- breakdown, factors
- latitude, longitude (for map markers)
- complaint_count
```

## Database Schema

### RoadRiskPrediction Table
| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT | Primary key |
| road_id | TEXT UNIQUE | FK to roads |
| risk_percentage | INT | 0-100 score |
| urgency | TEXT | Critical\|High\|Medium\|Low |
| confidence | INT | 0-100 prediction confidence |
| breakdown | TEXT | JSON with factor breakdown |
| factors | TEXT | JSON with detailed factors |
| calculated_at | DATETIME | When prediction was calculated |
| updated_at | DATETIME | Last update timestamp |

## Troubleshooting

### Map Not Loading
- Ensure you're not using SSR (dynamic import already handles this)
- Check browser console for leaflet CSS errors
- Verify `react-leaflet` and `leaflet` are installed

### No Roads Appearing on Map
- Roads need complaint data with latitude/longitude
- Check if complaints table has valid coordinates
- Run `/api/risk/map-data` directly to debug

### Predictions Not Updating
- Check that Prisma connection is valid
- Verify `RoadRiskPrediction` table was created
- Run `npm run db:generate` to regenerate Prisma client

### Performance Issues
- Predictions are cached in database
- Only recalculated when data changes
- For large datasets, consider pagination

## Integration with YOLO

To enable actual image analysis:

1. **Update complaint image handling**:
```typescript
// In /api/risk/calculate
const complaints = await prisma.complaint.findMany({
  where: { road_id: roadId },
  include: { image_url: true } // Add images
});

// Pass to YOLO analysis
const yoloOutputs = await analyzeRoadImages(
  complaints.map(c => c.image_url)
);
```

2. **Process YOLO detections**:
```python
# In risk_predictor.py
defects = predictor.calculate_defect_features(images, yolo_outputs)
# Returns: avg_density, max_severity, defect_types
```

## Next Steps

- [ ] Train actual ML model with historical data
- [ ] Integrate YOLO for real defect detection
- [ ] Add traffic pattern data
- [ ] Implement real-time alerts
- [ ] Add predictive maintenance recommendations
- [ ] Create export/report functionality
- [ ] Build comparison tool for multiple roads

## Support

For issues or questions:
1. Check `/memories/repo/risk-predictor-implementation.md` for details
2. Review API response schemas
3. Check Prisma logs for database errors
4. Verify all dependencies are installed
