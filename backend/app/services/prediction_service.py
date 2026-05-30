import random
from app.models.schemas import PredictionRequest

class PredictionService:
    @staticmethod
    def calculate_flood_risk(request: PredictionRequest) -> dict:
        rainfall_factor = min(request.rainfall / 300, 1.0) * 0.30
        elevation_factor = max(1 - request.elevation / 1000, 0) * 0.25
        land_use_scores = {"urban": 0.8, "suburban": 0.5, "rural": 0.3, "forest": 0.1}
        land_use_factor = land_use_scores.get(request.land_use, 0.5) * 0.20
        drainage_factor = max(1 - request.drainage_capacity / 100, 0) * 0.15
        density_factor = min(request.population_density / 15000, 1.0) * 0.10
        
        score = (rainfall_factor + elevation_factor + land_use_factor + drainage_factor + density_factor) * 10
        score = round(min(max(score + random.uniform(-0.5, 0.5), 0), 10), 1)
        
        level = (
            "critical" if score > 8.5
            else "high" if score > 6.5
            else "medium" if score > 4.0
            else "low"
        )
        
        return {
            "overall_risk": level,
            "score": score,
            "factors": [
                {"name": "Rainfall Intensity", "value": round(rainfall_factor / 0.30 * 100), "weight": 0.30, "impact": "High" if rainfall_factor > 0.2 else "Medium"},
                {"name": "Elevation Profile", "value": round(elevation_factor / 0.25 * 100), "weight": 0.25, "impact": "High" if elevation_factor > 0.15 else "Medium"},
                {"name": "Land Use Pattern", "value": round(land_use_factor / 0.20 * 100), "weight": 0.20, "impact": "High" if land_use_factor > 0.12 else "Medium"},
                {"name": "Drainage Capacity", "value": round(drainage_factor / 0.15 * 100), "weight": 0.15, "impact": "Critical" if drainage_factor > 0.10 else "Medium"},
                {"name": "Population Density", "value": round(density_factor / 0.10 * 100), "weight": 0.10, "impact": "Medium"},
            ],
            "recommendations": [
                "Deploy flood barriers in high-risk sectors",
                "Activate emergency drainage pumps",
                "Alert residents in high-risk zones",
                "Pre-position emergency response teams",
                "Coordinate with upstream water management",
            ],
        }
