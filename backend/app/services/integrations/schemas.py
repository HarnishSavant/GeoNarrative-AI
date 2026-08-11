from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class WeatherObservation(BaseModel):
    timestamp: datetime
    location_name: str
    latitude: float
    longitude: float
    rainfall_mm_per_hour: float
    temperature_celsius: float
    humidity_percent: float
    wind_speed_kmh: float

class RiverSensorReading(BaseModel):
    sensor_id: str
    timestamp: datetime
    river_level_meters: float
    discharge_rate_cumecs: float
    warning_level_meters: float
    danger_level_meters: float

class IoTSensorReading(BaseModel):
    device_id: str
    timestamp: datetime
    sensor_type: str  # e.g., 'soil_moisture', 'water_level', 'flow_rate'
    value: float
    unit: str
    battery_level_percent: float
    status: str

class MLPredictionResult(BaseModel):
    model_id: str
    timestamp: datetime
    predicted_flood_level_meters: float
    confidence_score: float
    prediction_horizon_hours: int
    contributing_factors: Dict[str, float]

class EmergencyAlertRequest(BaseModel):
    alert_id: str
    severity: str  # 'minor', 'moderate', 'severe', 'extreme'
    affected_zones: List[str]
    message: str
    issued_at: datetime
    action_required: str
