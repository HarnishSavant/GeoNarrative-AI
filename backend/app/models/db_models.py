from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    features_count = Column(Integer, default=0)
    file_size = Column(Float, default=0.0) # size in MB
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Stores parsed GeoJSON as a general geometry collections with spatial index
    geom = Column(Geometry("GEOMETRYCOLLECTION", srid=4326), nullable=True)


class FloodZone(Base):
    __tablename__ = "flood_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    risk_level = Column(String, nullable=False) # low, medium, high, critical
    inundation_depth = Column(Float, default=0.0) # depth in meters
    
    # Spatial column storing flood boundaries (supports standard multipolygons)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=False)


class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True) # hospital, substation, pump_station, transit, etc.
    status = Column(String, default="active") # active, warning, offline
    
    # Spatial column storing locations as points (e.g. Pune coordinates)
    geom = Column(Geometry("POINT", srid=4326), nullable=False)


class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False) # user or assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Metadata includes sources, coordinates search, and vector data indices
    metadata_json = Column(JSON, nullable=True)


class AnalyticsHistory(Base):
    __tablename__ = "analytics_history"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, nullable=False, index=True)
    metric_name = Column(String, nullable=False) # rainfall, risk_index, zoning_deviation
    metric_value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    report_type = Column(String, default="comprehensive") # flood_assessment, utility_audit, etc.
    summary = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    rainfall_intensity = Column(Float, nullable=False)
    elevation = Column(Float, nullable=False)
    land_use = Column(String, nullable=False)
    calculated_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    recommendations = Column(JSON, nullable=True) # List of actions
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
