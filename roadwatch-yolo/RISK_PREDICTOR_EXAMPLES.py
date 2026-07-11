"""
Risk Predictor ML Service - Usage Guide
This module provides a hybrid ML approach for road risk prediction.

Three-Layer Model:
  1. Image Analysis (40%) - YOLO defect detection
  2. Statistical Analysis (40%) - Historical data
  3. Temporal Analysis (20%) - Trends and seasonality
"""

# Example 1: Basic Risk Prediction
from risk_predictor import RiskPredictor, RoadRiskFeatures

predictor = RiskPredictor()

# Create a features object
features = RoadRiskFeatures(
    road_id="road_123",
    road_name="Pollachi road",
    district="Coimbatore",
    
    # Image-based features (from YOLO)
    avg_defect_density=45.0,      # % of image with defects
    max_defect_severity=75.0,     # worst defect severity 0-100
    defect_types={"crack": 5, "pothole": 2},
    recent_image_count=8,         # images in last 30 days
    
    # Statistical features
    accident_count=2536,          # total accidents in district
    complaint_count=42,           # complaints for this road
    complaint_severity_avg=65.0,  # average severity
    critical_complaints_ratio=0.3, # 30% are critical
    
    # Temporal features
    complaint_trend=0.2,          # +0.2 = increasing trend
    days_since_last_complaint=5,  # very recent
    seasonal_risk=0.7,            # monsoon season
)

# Get prediction
prediction = predictor.predict_risk(features)

print(f"Risk Score: {prediction['risk_percentage']}%")
print(f"Urgency: {prediction['urgency']}")
print(f"Confidence: {prediction['confidence']}")
print(f"Breakdown: {prediction['breakdown']}")
# Output:
# Risk Score: 72.8%
# Urgency: High
# Confidence: 0.85
# Breakdown: {
#   'image_analysis': 58.5,
#   'accident_impact': 84.6,
#   'complaint_impact': 84.0,
#   'temporal_impact': 42.0
# }


# Example 2: Calculate Features from Database Records
from risk_predictor import build_road_features
from datetime import datetime

road = {
    "id": "road_123",
    "road_name": "Pollachi road",
    "district": "Coimbatore",
    "total_length_km": 25.5,
    "estimated_amount": 5000000
}

complaints = [
    {
        "id": "c1",
        "created_at": datetime(2026, 6, 30),
        "severity": "High",
        "image_url": "/path/to/image1.jpg"
    },
    {
        "id": "c2",
        "created_at": datetime(2026, 6, 15),
        "severity": "Medium",
        "image_url": "/path/to/image2.jpg"
    }
]

# Simulated YOLO outputs from images
yolo_outputs = [
    {
        "image": "image1.jpg",
        "detections": [
            {"class": "crack", "confidence": 0.92, "area": 0.35},
            {"class": "crack", "confidence": 0.88, "area": 0.25}
        ]
    },
    {
        "image": "image2.jpg",
        "detections": [
            {"class": "pothole", "confidence": 0.85, "area": 0.15}
        ]
    }
]

images = [
    {"created_at": datetime(2026, 6, 30), "filename": "image1.jpg"},
    {"created_at": datetime(2026, 6, 15), "filename": "image2.jpg"}
]

# Build features automatically
features = build_road_features(
    road=road,
    complaints=complaints,
    accidents=2536,
    yolo_outputs=yolo_outputs,
    images=images
)

prediction = predictor.predict_risk(features)
print(f"\nPrediction for {features.road_name}:")
print(f"  Risk: {prediction['risk_percentage']}%")
print(f"  Urgency: {prediction['urgency']}")


# Example 3: Analyze Complaint Trends
temporal_features = predictor.calculate_temporal_features(complaints)
trend_score, days_since, seasonal_risk = temporal_features

print(f"\nTemporal Analysis:")
print(f"  Trend Score: {trend_score} (positive = increasing risk)")
print(f"  Days Since Last Complaint: {days_since}")
print(f"  Seasonal Risk Factor: {seasonal_risk}")


# Example 4: Extract Defect Features from YOLO
defect_density, max_severity, defect_types = predictor.calculate_defect_features(
    images=images,
    yolo_outputs=yolo_outputs
)

print(f"\nDefect Analysis:")
print(f"  Average Defect Density: {defect_density}%")
print(f"  Max Severity: {max_severity}%")
print(f"  Defect Types: {defect_types}")


# Example 5: Get Urgency Level
risk_scores = [25, 45, 65, 85]
for score in risk_scores:
    urgency = predictor.get_urgency_level(score)
    print(f"Risk {score}% -> Urgency: {urgency}")

# Output:
# Risk 25% -> Urgency: Low
# Risk 45% -> Urgency: Medium
# Risk 65% -> Urgency: High
# Risk 85% -> Urgency: Critical


"""
FORMULA BREAKDOWN

1. IMAGE ANALYSIS (40% weight)
   image_risk = (defect_density * 0.6) + (max_severity * 0.4)
   
   Example: 45% density, 75% severity
   image_risk = (45 * 0.6) + (75 * 0.4) = 27 + 30 = 57%

2. STATISTICAL ANALYSIS (40% weight)
   accident_risk = min((accidents / 3000) * 100, 100)
   complaint_risk = min((complaints / 50) * 100, 100)
   
   statistical_risk = (accident_risk * 0.4) 
                    + (complaint_risk * 0.4) 
                    + (severity_avg * 0.2)
   
   Example: 2536 accidents, 42 complaints, 65% severity
   accident_risk = (2536/3000)*100 = 84.5%
   complaint_risk = (42/50)*100 = 84%
   statistical_risk = (84.5*0.4) + (84*0.4) + (65*0.2) = 80.8%

3. TEMPORAL ANALYSIS (20% weight)
   recency_risk = max(0, 100 - (days_since/365)*100)
   trend_impact = max(0, trend_score * 100)
   
   temporal_risk = ((recency*0.6) + (trend*0.4)) * seasonal_factor
   
   Example: 5 days, trend +0.2, seasonal 0.7
   recency_risk = 100 - (5/365)*100 = 98.6%
   trend_impact = 0.2 * 100 = 20%
   temporal_risk = ((98.6*0.6) + (20*0.4)) * 0.7 = 51.6%

4. FINAL ENSEMBLE
   final_risk = (image_risk * 0.4) 
              + (statistical_risk * 0.4) 
              + (temporal_risk * 0.2)
   
   final_risk = (57*0.4) + (80.8*0.4) + (51.6*0.2)
              = 22.8 + 32.32 + 10.32 = 65.44%
   
   Urgency: High (65.44% >= 60%)

NORMALIZATION FACTORS:
  - Accidents: normalized to max 3000
  - Complaints: normalized to max 50
  - Defect density: 0-100%
  - Severity scores: 0-100%
  - Time: 0-365 days
"""

# Example 6: Using with FastAPI
# This is already implemented in risk_api.py
# But here's how you'd use it in an endpoint:

"""
@router.post("/predict/{road_id}")
async def predict_road_risk(road_id: str):
    # Fetch all data from database
    road = await db.get_road(road_id)
    complaints = await db.get_complaints(road_id)
    accidents = await db.get_accidents(road.district)
    
    # Build features
    features = build_road_features(
        road=road.__dict__,
        complaints=[c.__dict__ for c in complaints],
        accidents=accidents,
        yolo_outputs=[],  # From image analysis service
        images=[]  # From complaint records
    )
    
    # Predict
    predictor = RiskPredictor()
    prediction = predictor.predict_risk(features)
    
    # Store in database
    await db.save_prediction(
        road_id=road_id,
        risk_percentage=int(prediction['risk_percentage']),
        urgency=predictor.get_urgency_level(prediction['risk_percentage']),
        confidence=int(prediction['confidence'] * 100),
        breakdown=json.dumps(prediction['breakdown']),
        factors=json.dumps(prediction['factors'])
    )
    
    return prediction
"""

print("\n✅ Risk Predictor ML Service - Ready to use!")
print("See comments above for examples and formula breakdown.")
