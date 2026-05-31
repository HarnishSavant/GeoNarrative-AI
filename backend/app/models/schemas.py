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
    domain: str = "flood" # flood, traffic, urban, utility

class PredictionResponse(BaseModel):
    overall_risk: str
    score: float
    factors: List[dict]
    recommendations: List[str]
    model_metrics: Optional[dict] = None # R2, RMSE, Accuracy, F1
    feature_importance: Optional[List[dict]] = None # Random Forest and XGBoost weights

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


# SaaS Schemas
class SubscriptionUpgradeRequest(BaseModel):
    plan_type: str # free, premium_monthly, premium_6months, premium_annual
    payment_method: str = "Card" # Card, UPI, NetBanking

class SubscriptionStatusResponse(BaseModel):
    plan_type: str
    status: str
    price: float
    currency: str
    starts_at: str
    expires_at: Optional[str] = None
    credits_remaining: int
    credits_used: int
    credit_limit: int

class PaymentHistoryItem(BaseModel):
    id: int
    amount: float
    currency: str
    payment_status: str
    transaction_id: Optional[str] = None
    payment_method: str
    created_at: str

class UsageLogItem(BaseModel):
    id: int
    request_path: str
    request_method: str
    feature_domain: str
    credits_consumed: int
    created_at: str

class AdminRevenueAnalyticsResponse(BaseModel):
    total_revenue: float
    active_subscriptions: int
    plan_distribution: dict # {"free": 5, "premium_monthly": 10...}
    recent_payments: List[PaymentHistoryItem]
    usage_trends: List[dict] # hourly/daily usage counts


# Razorpay Schemas
class RazorpayOrderRequest(BaseModel):
    plan_type: str

class RazorpayOrderResponse(BaseModel):
    key: str
    amount: int # in paise
    currency: str
    order_id: str
    plan_type: str
    user_name: str
    user_email: str

class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_type: str


# Enterprise Support, Profile, and Logging Schemas
from datetime import datetime

class InquiryCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class InquiryResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str = "General"

class TicketResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    description: str
    category: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action_type: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    industry: Optional[str] = None
    designation: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str
