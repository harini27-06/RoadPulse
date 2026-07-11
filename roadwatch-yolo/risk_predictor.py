"""
Risk Prediction ML Service
Hybrid approach combining YOLO image analysis + statistical features
"""

import numpy as np
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import pickle
import os

@dataclass
class RoadRiskFeatures:
    """Features extracted for risk prediction"""
    road_id: str
    road_name: str
    district: str
    
    # Image-based features (YOLO analysis)
    avg_defect_density: float  # 0-100, density of detected defects
    max_defect_severity: float  # 0-100, worst defect severity
    defect_types: Dict[str, int]  # {crack: count, pothole: count, etc}
    recent_image_count: int  # images in last 30 days
    
    # Statistical features
    accident_count: int  # total accidents in district
    complaint_count: int  # total complaints for road
    complaint_severity_avg: float  # avg severity 0-100
    critical_complaints_ratio: float  # % of critical complaints
    
    # Temporal features
    complaint_trend: float  # -1 to 1, increasing or decreasing trend
    days_since_last_complaint: int  # recency
    seasonal_risk: float  # 0-1, risk factor based on season
    
    # Derived features
    road_length_km: Optional[float] = None
    maintenance_budget: Optional[float] = None
    
    def to_feature_vector(self) -> np.ndarray:
        """Convert to feature vector for model"""
        return np.array([
            self.avg_defect_density,
            self.max_defect_severity,
            self.recent_image_count,
            self.accident_count / 5000,  # normalize
            self.complaint_count / 100,  # normalize
            self.complaint_severity_avg,
            self.critical_complaints_ratio,
            self.complaint_trend,
            min(self.days_since_last_complaint, 365) / 365,  # normalize
            self.seasonal_risk,
        ])


class RiskPredictor:
    """ML model for road risk prediction"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = [
            'defect_density', 'max_severity', 'recent_images', 'accidents',
            'complaints', 'severity_avg', 'critical_ratio', 'trend',
            'days_since_complaint', 'seasonal_risk'
        ]
    
    def calculate_defect_features(self, images: List[Dict], yolo_outputs: List[Dict]) -> Tuple[float, float, Dict[str, int]]:
        """
        Extract defect features from YOLO detections
        
        Args:
            images: List of image metadata
            yolo_outputs: List of YOLO detection results
            
        Returns:
            (avg_defect_density, max_severity, defect_types_count)
        """
        if not yolo_outputs or not images:
            return 0.0, 0.0, {"crack": 0, "pothole": 0}
        
        densities = []
        severities = []
        defect_counts = {"crack": 0, "pothole": 0, "pavement_damage": 0, "potholes": 0}
        
        for output in yolo_outputs:
            # Calculate defect density (% of image covered by defects)
            detections = output.get("detections", [])
            if detections:
                total_area = sum(d.get("area", 0) for d in detections)
                density = min(total_area * 100, 100)  # Convert to percentage
                densities.append(density)
                
                # Track defect types and severity
                for detection in detections:
                    class_name = detection.get("class", "unknown").lower()
                    if "crack" in class_name:
                        defect_counts["crack"] += 1
                    elif "pothole" in class_name:
                        defect_counts["pothole"] += 1
                    elif "damage" in class_name:
                        defect_counts["pavement_damage"] += 1
                    
                    # Severity based on confidence score
                    confidence = detection.get("confidence", 0.5)
                    severities.append(confidence * 100)
        
        avg_density = np.mean(densities) if densities else 0.0
        max_severity = np.max(severities) if severities else 0.0
        
        return float(avg_density), float(max_severity), defect_counts
    
    def calculate_temporal_features(self, complaints_data: List[Dict]) -> Tuple[float, int, float]:
        """
        Calculate trend and recency features from complaint history
        
        Args:
            complaints_data: List of complaint records with dates
            
        Returns:
            (trend_score, days_since_last, seasonal_risk)
        """
        if not complaints_data:
            return 0.0, 365, 0.0
        
        # Sort by date
        sorted_complaints = sorted(
            complaints_data,
            key=lambda x: x.get("created_at", datetime.now())
        )
        
        # Calculate trend (last 30 days vs previous 30 days)
        today = datetime.now()
        recent_count = sum(1 for c in sorted_complaints 
                          if (today - c.get("created_at", today)).days <= 30)
        previous_count = sum(1 for c in sorted_complaints 
                            if 30 < (today - c.get("created_at", today)).days <= 60)
        
        trend_score = (recent_count - previous_count) / max(previous_count + recent_count, 1)
        
        # Days since last complaint
        last_complaint_date = sorted_complaints[-1].get("created_at", today)
        days_since = (today - last_complaint_date).days
        
        # Seasonal risk (higher during monsoon/winter)
        current_month = today.month
        seasonal_risk = 0.7 if current_month in [6, 7, 8, 9] else 0.3  # Monsoon months
        
        return float(trend_score), int(days_since), float(seasonal_risk)
    
    def predict_risk(self, features: RoadRiskFeatures) -> Dict:
        """
        Predict risk for a road
        
        Returns:
            {
                risk_percentage: 0-100,
                confidence: 0-1,
                breakdown: {
                    image_analysis: 0-100,
                    accident_impact: 0-100,
                    complaint_impact: 0-100,
                    temporal_impact: 0-100
                }
            }
        """
        # Layer 1: Image-based risk (40% weight)
        image_risk = (features.avg_defect_density * 0.6 + features.max_defect_severity * 0.4)
        
        # Layer 2: Statistical risk (40% weight)
        accident_risk = min((features.accident_count / 3000) * 100, 100)
        complaint_risk = min((features.complaint_count / 50) * 100, 100)
        severity_risk = features.complaint_severity_avg
        
        statistical_risk = (
            accident_risk * 0.4 +
            complaint_risk * 0.4 +
            severity_risk * 0.2
        )
        
        # Layer 3: Temporal risk (20% weight)
        recency_risk = max(0, 100 - (features.days_since_last_complaint / 365) * 100)
        trend_impact = max(0, features.complaint_trend * 100)  # positive trend = higher risk
        
        temporal_risk = (recency_risk * 0.6 + trend_impact * 0.4) * features.seasonal_risk
        
        # Ensemble: combine all layers
        final_risk = (
            image_risk * 0.4 +
            statistical_risk * 0.4 +
            temporal_risk * 0.2
        )
        
        # Confidence based on data availability
        confidence = min(
            (features.recent_image_count / 5) * 0.3 +
            (min(features.complaint_count, 10) / 10) * 0.4 +
            (features.accident_count / 3000) * 0.3,
            1.0
        )
        
        return {
            "risk_percentage": min(max(float(final_risk), 0), 100),
            "confidence": float(confidence),
            "breakdown": {
                "image_analysis": float(image_risk),
                "accident_impact": float(accident_risk),
                "complaint_impact": float(complaint_risk),
                "temporal_impact": float(temporal_risk),
            },
            "factors": {
                "defect_density": float(features.avg_defect_density),
                "defect_severity": float(features.max_defect_severity),
                "defect_types": features.defect_types,
                "critical_complaints": f"{features.critical_complaints_ratio * 100:.1f}%",
                "trend": "increasing" if features.complaint_trend > 0 else "decreasing",
                "days_since_complaint": features.days_since_last_complaint,
            }
        }
    
    def get_urgency_level(self, risk_percentage: float) -> str:
        """Classify urgency based on risk"""
        if risk_percentage >= 80:
            return "Critical"
        elif risk_percentage >= 60:
            return "High"
        elif risk_percentage >= 40:
            return "Medium"
        else:
            return "Low"


# Utility function to extract features from database records
def build_road_features(
    road: Dict,
    complaints: List[Dict],
    accidents: int,
    yolo_outputs: List[Dict],
    images: List[Dict]
) -> RoadRiskFeatures:
    """Build feature object from road and complaint data"""
    
    predictor = RiskPredictor()
    
    # Image-based features
    avg_density, max_severity, defect_types = predictor.calculate_defect_features(images, yolo_outputs)
    
    recent_images = len([img for img in images if (datetime.now() - img.get("created_at", datetime.now())).days <= 30])
    
    # Statistical features
    complaint_severities = [float(c.get("severity_score", 50)) for c in complaints if c.get("severity_score")]
    avg_severity = np.mean(complaint_severities) if complaint_severities else 0.0
    critical_count = sum(1 for c in complaints if c.get("severity_score", 0) >= 80)
    critical_ratio = critical_count / len(complaints) if complaints else 0.0
    
    # Temporal features
    trend, days_since, seasonal = predictor.calculate_temporal_features(complaints)
    
    return RoadRiskFeatures(
        road_id=road.get("id"),
        road_name=road.get("road_name"),
        district=road.get("district"),
        avg_defect_density=avg_density,
        max_defect_severity=max_severity,
        defect_types=defect_types,
        recent_image_count=recent_images,
        accident_count=accidents,
        complaint_count=len(complaints),
        complaint_severity_avg=avg_severity,
        critical_complaints_ratio=critical_ratio,
        complaint_trend=trend,
        days_since_last_complaint=days_since,
        seasonal_risk=seasonal,
        road_length_km=road.get("total_length_km"),
        maintenance_budget=road.get("estimated_amount"),
    )
