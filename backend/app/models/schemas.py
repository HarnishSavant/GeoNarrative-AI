from typing import List, Optional
from pydantic import BaseModel

class LocationSearchRequest(BaseModel):
    query: str

class LocationResponse(BaseModel):
    name: str
    lat: float
    lng: float
    country: str
    state: str

class ChatRequest(BaseModel):
    message: str
    location: Optional[str] = None
    context: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    message: str
    metadata: dict

class PredictionRequest(BaseModel):
    rainfall: float = 245.0
    elevation: float = 540.0
    land_use: str = "urban"
    water_bodies: int = 23
    population_density: float = 9500.0
    drainage_capacity: float = 60.0
    location: Optional[str] = None

class PredictionResponse(BaseModel):
    overall_risk: str
    score: float
    factors: List[dict]
    recommendations: List[str]

class FloodZone(BaseModel):
    zone: str
    level: str
    score: float
    area: float
    population: int
    description: str

class AnalyticsResponse(BaseModel):
    rainfall: List[dict]
    risk_distribution: List[dict]
    infrastructure: List[dict]
    population_density: List[dict]
    time_series_risk: List[dict]

class KPIResponse(BaseModel):
    flood_risk_score: float
    population_at_risk: str
    infrastructure_score: str
    avg_rainfall: str
    avg_elevation: str
    water_bodies: int

class ReportRequest(BaseModel):
    location: str
    report_type: str = "comprehensive"

class ReportResponse(BaseModel):
    id: str
    title: str
    location: str
    generated_at: str
    risk_level: str
    summary: str
    sections: List[dict]
