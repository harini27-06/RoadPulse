"""
FastAPI endpoint for Risk Prediction
Integrates with the ML service and database
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from datetime import datetime

# Import the risk predictor
import sys
sys.path.insert(0, '/Users/USER/Desktop/RoadWatchChat/roadwatch-yolo')
from risk_predictor import RiskPredictor, build_road_features, RoadRiskFeatures

router = APIRouter(prefix="/api/risk", tags=["risk"])

class RiskPredictionRequest(BaseModel):
    road_id: str

class RiskPredictionResponse(BaseModel):
    road_id: str
    road_name: str
    district: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_percentage: int
    urgency: str
    confidence: int
    breakdown: Dict
    factors: Dict

@router.post("/predict/{road_id}")
async def predict_road_risk(road_id: str) -> RiskPredictionResponse:
    """
    Predict risk for a specific road using hybrid ML model
    """
    try:
        from prisma import Prisma
        
        prisma = Prisma()
        await prisma.connect()
        
        # Fetch road data
        road = await prisma.road.find_unique(where={"id": road_id})
        if not road:
            raise HTTPException(status_code=404, detail="Road not found")
        
        # Fetch complaints for this road
        complaints = await prisma.complaint.find_many(
            where={"road_id": road_id}
        )
        
        # Fetch accidents for district
        accident = await prisma.accident.find_unique(
            where={"district": road.district}
        )
        accident_count = accident.total_accidents if accident else 0
        
        # Build features (without YOLO for now - we'll integrate that next)
        features = build_road_features(
            road=road.__dict__,
            complaints=[c.__dict__ for c in complaints],
            accidents=accident_count,
            yolo_outputs=[],  # Will be integrated with image analysis
            images=[]  # Will fetch from complaint images
        )
        
        # Predict risk
        predictor = RiskPredictor()
        prediction = predictor.predict_risk(features)
        
        # Save prediction to database
        await prisma.road_risk_prediction.upsert(
            where={"road_id": road_id},
            create={
                "road_id": road_id,
                "risk_percentage": int(prediction["risk_percentage"]),
                "urgency": predictor.get_urgency_level(prediction["risk_percentage"]),
                "confidence": int(prediction["confidence"] * 100),
                "breakdown": json.dumps(prediction["breakdown"]),
                "factors": json.dumps(prediction["factors"]),
            },
            update={
                "risk_percentage": int(prediction["risk_percentage"]),
                "urgency": predictor.get_urgency_level(prediction["risk_percentage"]),
                "confidence": int(prediction["confidence"] * 100),
                "breakdown": json.dumps(prediction["breakdown"]),
                "factors": json.dumps(prediction["factors"]),
                "updated_at": datetime.utcnow(),
            }
        )
        
        await prisma.disconnect()
        
        return RiskPredictionResponse(
            road_id=road.id,
            road_name=road.road_name,
            district=road.district,
            risk_percentage=int(prediction["risk_percentage"]),
            urgency=predictor.get_urgency_level(prediction["risk_percentage"]),
            confidence=int(prediction["confidence"] * 100),
            breakdown=prediction["breakdown"],
            factors=prediction["factors"],
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all-roads")
async def get_all_roads_risk() -> List[RiskPredictionResponse]:
    """
    Get risk predictions for all roads
    Calculates if not cached, returns cached if recent
    """
    try:
        from prisma import Prisma
        
        prisma = Prisma()
        await prisma.connect()
        
        # Get all roads
        roads = await prisma.road.find_many()
        
        results = []
        predictor = RiskPredictor()
        
        for road in roads:
            # Get existing prediction if recent
            existing = await prisma.road_risk_prediction.find_unique(
                where={"road_id": road.id}
            )
            
            if existing:
                results.append(RiskPredictionResponse(
                    road_id=existing.road_id,
                    road_name=road.road_name,
                    district=road.district,
                    risk_percentage=existing.risk_percentage,
                    urgency=existing.urgency,
                    confidence=existing.confidence,
                    breakdown=json.loads(existing.breakdown),
                    factors=json.loads(existing.factors),
                ))
            else:
                # Calculate new prediction
                complaints = await prisma.complaint.find_many(
                    where={"road_id": road.id}
                )
                
                accident = await prisma.accident.find_unique(
                    where={"district": road.district}
                )
                accident_count = accident.total_accidents if accident else 0
                
                features = build_road_features(
                    road=road.__dict__,
                    complaints=[c.__dict__ for c in complaints],
                    accidents=accident_count,
                    yolo_outputs=[],
                    images=[]
                )
                
                prediction = predictor.predict_risk(features)
                
                # Save to database
                created = await prisma.road_risk_prediction.create(
                    data={
                        "road_id": road.id,
                        "risk_percentage": int(prediction["risk_percentage"]),
                        "urgency": predictor.get_urgency_level(prediction["risk_percentage"]),
                        "confidence": int(prediction["confidence"] * 100),
                        "breakdown": json.dumps(prediction["breakdown"]),
                        "factors": json.dumps(prediction["factors"]),
                    }
                )
                
                results.append(RiskPredictionResponse(
                    road_id=created.road_id,
                    road_name=road.road_name,
                    district=road.district,
                    risk_percentage=int(prediction["risk_percentage"]),
                    urgency=predictor.get_urgency_level(prediction["risk_percentage"]),
                    confidence=int(prediction["confidence"] * 100),
                    breakdown=prediction["breakdown"],
                    factors=prediction["factors"],
                ))
        
        await prisma.disconnect()
        
        # Sort by risk percentage
        return sorted(results, key=lambda x: x.risk_percentage, reverse=True)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
