from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, func, Boolean
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    industry = Column(String, nullable=True) # Domain/Industry
    designation = Column(String, nullable=True) # Job Designation
    
    # Account status & Authentication
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    role = Column(String, default="user", nullable=False) # admin, user
    
    # SaaS Subscription
    credits = Column(Integer, default=100, nullable=False) # credits remaining
    subscription = Column(String, default="free", nullable=False) # free, basic, premium
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
    user_credits = relationship("Credit", back_populates="user", uselist=False, cascade="all, delete-orphan")


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


class HexagonGrid(Base):
    __tablename__ = "hexagon_grid"

    id = Column(Integer, primary_key=True, index=True)
    
    # UNDRR Scores per cell
    h_score = Column(Float, default=0.0) # Hazard
    e_score = Column(Float, default=0.0) # Exposure
    v_score = Column(Float, default=0.0) # Vulnerability
    c_score = Column(Float, default=1.0) # Capacity
    
    risk_score = Column(Float, default=0.0) # 0 to 10
    risk_level = Column(String, default="low") # low, medium, high, critical
    
    # Raw stats
    population = Column(Integer, default=0)
    buildings = Column(Integer, default=0)
    hospitals = Column(Integer, default=0)
    
    # Spatial column storing hexagon polygon
    geom = Column(Geometry("POLYGON", srid=4326), nullable=False)


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
    domain = Column(String, default="flood", nullable=False) # flood, traffic, urban, utility
    rainfall_intensity = Column(Float, nullable=False)
    elevation = Column(Float, nullable=False)
    river_proximity = Column(Float, default=500.0, nullable=False) # distance in meters
    urban_density = Column(Float, default=5000.0, nullable=False) # people/km2
    land_use = Column(String, nullable=False)
    calculated_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    recommendations = Column(JSON, nullable=True) # List of actions
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Store predictions in PostGIS with spatial index for regional safety zoning audits
    geom = Column(Geometry("POINT", srid=4326), nullable=True)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_type = Column(String, default="free", nullable=False) # free, premium_monthly, premium_6months, premium_annual
    price = Column(Float, default=0.0, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    status = Column(String, default="active", nullable=False) # active, expired, cancelled
    starts_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    payment_status = Column(String, default="success", nullable=False) # success, pending, failed
    transaction_id = Column(String, unique=True, index=True, nullable=True)
    payment_method = Column(String, default="Card", nullable=False) # Card, UPI, NetBanking
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_path = Column(String, nullable=False)
    request_method = Column(String, nullable=False)
    feature_domain = Column(String, nullable=False) # flood, traffic, urban, utility, ai_chat
    credits_consumed = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="usage_logs")


class Credit(Base):
    __tablename__ = "credits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    credit_limit = Column(Integer, default=100, nullable=False)
    credits_used = Column(Integer, default=0, nullable=False)
    credits_remaining = Column(Integer, default=100, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="user_credits")


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, default="General", nullable=False) # Technical, Billing, General
    status = Column(String, default="open", nullable=False) # open, in_progress, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String, nullable=False, index=True) # login, analysis, chat, report
    details = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String, nullable=False, index=True) # rate_limit_hit, validation_error, unauthorized_access, auth_success, auth_failure
    resource = Column(String, nullable=False)
    status = Column(String, nullable=False) # success, failure
    details = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")


class DatasetMetadata(Base):
    """
    Research-Grade Geospatial Data Pipeline Metadata
    Tracks all datasets used in the Pune Metropolitan Region Digital Twin.
    """
    __tablename__ = "dataset_metadata"

    id = Column(Integer, primary_key=True, index=True)
    layer_name = Column(String, nullable=False, index=True) # e.g. "DEM (SRTM)", "Land Use / Land Cover"
    purpose = Column(String, nullable=False) # e.g. "Elevation, Slope, Aspect", "Urban Expansion"
    source = Column(String, nullable=False) # Data Provider / Source
    resolution = Column(String, nullable=False) # Spatial Resolution
    coverage = Column(String, nullable=False) # Coverage Area
    date_acquired = Column(DateTime, default=datetime.datetime.utcnow)
    is_raster = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    datasets = relationship("SpatialDataset", back_populates="metadata_ref", cascade="all, delete-orphan")


class SpatialDataset(Base):
    """
    Unified table for storing structural vector assets and spatial telemetry.
    """
    __tablename__ = "spatial_datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("dataset_metadata.id", ondelete="CASCADE"), nullable=False)
    
    # Generic spatial geometry storage supporting points, lines, polygons
    geom = Column(Geometry("GEOMETRY", srid=4326), nullable=False)
    properties = Column(JSON, nullable=True) # GeoJSON attributes / feature properties
    
    metadata_ref = relationship("DatasetMetadata", back_populates="datasets")
