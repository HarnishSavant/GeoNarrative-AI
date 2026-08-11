from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from datetime import datetime
from .schemas import (
    WeatherObservation,
    RiverSensorReading,
    IoTSensorReading,
    MLPredictionResult,
    EmergencyAlertRequest
)

class IWeatherAPI(ABC):
    """
    Modular Interface for External Weather Data Providers (e.g., OpenWeather, IMD).
    Allows seamless switching between API providers without affecting core logic.
    """
    @abstractmethod
    async def get_current_weather(self, lat: float, lon: float) -> WeatherObservation:
        pass

    @abstractmethod
    async def get_forecast(self, lat: float, lon: float, hours: int) -> List[WeatherObservation]:
        pass


class IRiverSensorAPI(ABC):
    """
    Interface for integrating with Government or Municipal River Gauge APIs.
    """
    @abstractmethod
    async def get_latest_reading(self, sensor_id: str) -> RiverSensorReading:
        pass

    @abstractmethod
    async def get_historical_data(self, sensor_id: str, start: datetime, end: datetime) -> List[RiverSensorReading]:
        pass


class IIoTSensorGateway(ABC):
    """
    Interface for ingesting telemetry from dispersed Smart City IoT sensors.
    """
    @abstractmethod
    async def fetch_sensor_status(self, device_id: str) -> IoTSensorReading:
        pass

    @abstractmethod
    async def stream_telemetry(self, region_id: str) -> List[IoTSensorReading]:
        pass


class IMLPredictionEngine(ABC):
    """
    Interface for connecting to external or microservice-based ML inference engines.
    """
    @abstractmethod
    async def request_flood_prediction(
        self, 
        current_weather: WeatherObservation, 
        river_state: RiverSensorReading,
        horizon_hours: int
    ) -> MLPredictionResult:
        pass


class IEmergencyAlertService(ABC):
    """
    Interface for dispatching automated alerts to external communication APIs 
    (e.g., SMS Gateways, Public Warning Systems).
    """
    @abstractmethod
    async def dispatch_alert(self, request: EmergencyAlertRequest) -> bool:
        pass

    @abstractmethod
    async def get_delivery_status(self, alert_id: str) -> Dict[str, str]:
        pass
