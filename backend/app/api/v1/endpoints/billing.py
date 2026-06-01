import datetime
import os
import random
import hmac
import hashlib
import logging
import urllib.request
import json
import base64
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.core.database import get_db
from app.models.db_models import User, Subscription, Payment, UsageLog, Credit
from app.api.v1.endpoints.auth import get_current_user, get_admin_user
from app.services.smtp_service import SMTPService
from app.models.schemas import (
    SubscriptionUpgradeRequest, 
    SubscriptionStatusResponse, 
    PaymentHistoryItem, 
    UsageLogItem,
    AdminRevenueAnalyticsResponse,
    RazorpayOrderRequest,
    RazorpayOrderResponse,
    RazorpayVerifyRequest
)

logger = logging.getLogger("geonarrative.billing")

# Razorpay Test Credentials (graceful config loading)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_geonar2026abcd")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "geonarrative_secret_key_2026")

router = APIRouter()

# Pricing Configs
PLAN_DETAILS = {
    "free": {"price": 0.0, "credits": 100, "days": None},
    "premium_monthly": {"price": 299.0, "credits": 1000, "days": 30},
    "premium_6months": {"price": 1499.0, "credits": 7000, "days": 180},
    "premium_annual": {"price": 2499.0, "credits": 15000, "days": 365}
}

@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns the active subscription plan and remaining geoprocessing credits for the current user."""
    # Find active subscription
    sub_res = await db.execute(
        select(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.created_at.desc())
    )
    active_sub = sub_res.scalars().first()
    
    # Query credits details
    credit_res = await db.execute(
        select(Credit).filter(Credit.user_id == current_user.id)
    )
    user_credit = credit_res.scalars().first()
    
    # Auto-initialize default Credit record if missing
    if not user_credit:
        user_credit = Credit(
            user_id=current_user.id,
            credit_limit=PLAN_DETAILS.get(current_user.subscription, PLAN_DETAILS["free"])["credits"],
            credits_used=0,
            credits_remaining=current_user.credits
        )
        db.add(user_credit)
        await db.commit()

    starts_str = active_sub.starts_at.isoformat() if active_sub else current_user.created_at.isoformat()
    expires_str = active_sub.expires_at.isoformat() if (active_sub and active_sub.expires_at) else None
    
    return SubscriptionStatusResponse(
        plan_type=active_sub.plan_type if active_sub else current_user.subscription,
        status=active_sub.status if active_sub else "active",
        price=active_sub.price if active_sub else 0.0,
        currency=active_sub.currency if active_sub else "INR",
        starts_at=starts_str,
        expires_at=expires_str,
        credits_remaining=current_user.credits,
        credits_used=user_credit.credits_used,
        credit_limit=user_credit.credit_limit
    )

@router.post("/create-order", response_model=RazorpayOrderResponse)
async def create_razorpay_order(
    req: RazorpayOrderRequest,
    current_user: User = Depends(get_current_user)
):
    """Initiates an order for standard Razorpay checkout verification flow."""
    plan = req.plan_type.strip().lower()
    if plan not in PLAN_DETAILS:
        raise HTTPException(status_code=400, detail="Requested subscription tier does not exist.")

    details = PLAN_DETAILS[plan]
    amount_paise = int(details["price"] * 100) # Razorpay operates in lowest denomination currency unit (paise)
    
    # Generate unique test order id fallback
    order_id = f"order_{os.urandom(8).hex()}"
    
    # If using a real developer key, contact the real Razorpay Orders API dynamically!
    if RAZORPAY_KEY_ID != "rzp_test_geonar2026abcd":
        try:
            url = "https://api.razorpay.com/v1/orders"
            post_payload = json.dumps({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"receipt_{os.urandom(4).hex()}"
            }).encode('utf-8')
            
            req_obj = urllib.request.Request(url, data=post_payload, method="POST")
            
            # Setup Basic Auth
            auth_str = f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}"
            encoded_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
            req_obj.add_header("Authorization", f"Basic {encoded_auth}")
            req_obj.add_header("Content-Type", "application/json")
            
            # Make the connection
            with urllib.request.urlopen(req_obj, timeout=6) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                if "id" in res_data:
                    order_id = res_data["id"]
                    logger.info(f"Real Razorpay Order created successfully: {order_id}")
        except Exception as e:
            error_details = str(e)
            if hasattr(e, 'read'):
                try:
                    error_details = e.read().decode('utf-8')
                except:
                    pass
            logger.error(f"Failed to create real Razorpay order dynamically: {error_details}")
            raise HTTPException(status_code=400, detail=f"Failed to initialize Razorpay: {error_details}")
    
    return RazorpayOrderResponse(
        key=RAZORPAY_KEY_ID,
        amount=amount_paise,
        currency="INR",
        order_id=order_id,
        plan_type=plan,
        user_name=current_user.full_name or current_user.username,
        user_email=current_user.email
    )

@router.post("/verify-payment")
async def verify_razorpay_payment(
    req: RazorpayVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Validates Razorpay payment signature, commits plan upgrades, and triggers email dispatches."""
    plan = req.plan_type.strip().lower()
    if plan not in PLAN_DETAILS:
        raise HTTPException(status_code=400, detail="Requested subscription tier does not exist.")

    details = PLAN_DETAILS[plan]
    
    # 1. Cryptographic HMAC Signature Verification
    is_valid_sig = False
    if req.razorpay_signature == "MOCK_SIGNATURE" and (RAZORPAY_KEY_ID == "rzp_test_geonar2026abcd" or RAZORPAY_KEY_ID.startswith("rzp_test_")):
      is_valid_sig = True
      logger.info("Local Sandbox billing bypass active. Verification approved.")
    else:
      message = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
      calculated_sig = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
      ).hexdigest()
      is_valid_sig = hmac.compare_digest(calculated_sig, req.razorpay_signature)
    
    if not is_valid_sig:
      raise HTTPException(status_code=400, detail="Secure signature verification failed. Fraud detected.")

    # 2. Deactivate previous active plans
    await db.execute(
        update(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .values(status="expired", updated_at=datetime.datetime.utcnow())
    )
    
    # 3. Insert active Subscription record
    starts = datetime.datetime.utcnow()
    expires = starts + datetime.timedelta(days=details["days"]) if details["days"] else None
    
    new_sub = Subscription(
        user_id=current_user.id,
        plan_type=plan,
        price=details["price"],
        currency="INR",
        status="active",
        starts_at=starts,
        expires_at=expires
    )
    db.add(new_sub)
    await db.flush() # Obtain new_sub.id
    
    # 4. Insert Payment record
    new_payment = Payment(
        user_id=current_user.id,
        subscription_id=new_sub.id,
        amount=details["price"],
        currency="INR",
        payment_status="success",
        transaction_id=req.razorpay_payment_id,
        payment_method="Card (Razorpay)"
    )
    db.add(new_payment)
    
    # 5. Allot geoprocess credits
    current_user.subscription = plan
    current_user.credits = details["credits"]
    
    # 6. Synchronize credits registry details
    credit_res = await db.execute(
        select(Credit).filter(Credit.user_id == current_user.id)
    )
    user_credit = credit_res.scalars().first()
    if not user_credit:
        user_credit = Credit(user_id=current_user.id)
        db.add(user_credit)
        
    user_credit.credit_limit = details["credits"]
    user_credit.credits_remaining = details["credits"]
    user_credit.updated_at = datetime.datetime.utcnow()
    
    await db.commit()
    
    # 7. Dispatches transaction and subscription activation emails asynchronously
    try:
        SMTPService.send_payment_success_email(
            email=current_user.email,
            username=current_user.username,
            amount=details["price"],
            plan_name=plan,
            tx_id=req.razorpay_payment_id
        )
        SMTPService.send_subscription_active_email(
            email=current_user.email,
            username=current_user.username,
            plan_name=plan,
            credits=details["credits"]
        )
    except Exception as email_err:
        print(f"Email Dispatch Failed during payment activation: {email_err}")
        
    return {
        "status": "success",
        "message": f"Payment verified. Upgraded to {plan.replace('_', ' ').capitalize()}!",
        "transaction_id": req.razorpay_payment_id,
        "credits": current_user.credits
    }

@router.get("/payments", response_model=List[PaymentHistoryItem])
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns historical invoices and transactions for the active planner."""
    res = await db.execute(
        select(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    payments = res.scalars().all()
    
    return [
        PaymentHistoryItem(
            id=p.id,
            amount=p.amount,
            currency=p.currency,
            payment_status=p.payment_status,
            transaction_id=p.transaction_id,
            payment_method=p.payment_method,
            created_at=p.created_at.isoformat()
        )
        for p in payments
    ]

@router.get("/usage", response_model=List[UsageLogItem])
async def get_usage_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns analytical credit consumption logs for tracking and invoicing."""
    res = await db.execute(
        select(UsageLog)
        .filter(UsageLog.user_id == current_user.id)
        .order_by(UsageLog.created_at.desc())
        .limit(100)
    )
    logs = res.scalars().all()
    
    return [
        UsageLogItem(
            id=l.id,
            request_path=l.request_path,
            request_method=l.request_method,
            feature_domain=l.feature_domain,
            credits_consumed=l.credits_consumed,
            created_at=l.created_at.isoformat()
        )
        for l in logs
    ]

# =====================================================================
#   ADMINISTRATIVE REVENUE TELEMETRY
# =====================================================================

@router.get("/admin/revenue", response_model=AdminRevenueAnalyticsResponse)
async def admin_get_revenue_analytics(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Exposes real-time gross SaaS revenue, payment logs, and geoprocess requests frequency to system admins."""
    # 1. Total revenue
    rev_res = await db.execute(
        select(func.sum(Payment.amount)).filter(Payment.payment_status == "success")
    )
    total_rev = rev_res.scalar() or 0.0

    # 2. Active subscriptions count
    sub_count_res = await db.execute(
        select(func.count(Subscription.id)).filter(
            Subscription.status == "active", 
            Subscription.plan_type != "free"
        )
    )
    active_subs = sub_count_res.scalar() or 0

    # 3. Plan distributions
    plan_dist = {"free": 0, "premium_monthly": 0, "premium_6months": 0, "premium_annual": 0}
    dist_res = await db.execute(
        select(User.subscription, func.count(User.id)).group_by(User.subscription)
    )
    for row in dist_res.all():
        p_name, count = row
        if p_name in plan_dist:
            plan_dist[p_name] = count

    # 4. Recent payments (last 10 items)
    payments_res = await db.execute(
        select(Payment).order_by(Payment.created_at.desc()).limit(15)
    )
    recent_p = payments_res.scalars().all()
    payment_items = [
        PaymentHistoryItem(
            id=p.id,
            amount=p.amount,
            currency=p.currency,
            payment_status=p.payment_status,
            transaction_id=p.transaction_id,
            payment_method=p.payment_method,
            created_at=p.created_at.isoformat()
        )
        for p in recent_p
    ]

    # 5. Usage trends (group logs by domain)
    usage_res = await db.execute(
        select(UsageLog.feature_domain, func.count(UsageLog.id))
        .group_by(UsageLog.feature_domain)
    )
    usage_trends = [
        {"domain": domain, "requests": count}
        for domain, count in usage_res.all()
    ]

    return AdminRevenueAnalyticsResponse(
        total_revenue=float(total_rev),
        active_subscriptions=active_subs,
        plan_distribution=plan_dist,
        recent_payments=payment_items,
        usage_trends=usage_trends
    )
