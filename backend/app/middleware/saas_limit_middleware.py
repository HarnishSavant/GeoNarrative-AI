import time
import datetime
import json
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.db_models import User, UsageLog, Credit, Subscription
from app.api.v1.endpoints.auth import decode_jwt_token

class SaaSLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method

        # 1. Identify which routes require active credit/plan audits
        is_ai_route = path.startswith("/api/v1/chat")
        is_prediction_route = path.startswith("/api/v1/predict")
        is_report_route = path.startswith("/api/v1/reports")
        
        # We only monitor SaaS limits on POST/GET execution pipelines
        if not (is_ai_route or is_prediction_route or is_report_route):
            return await call_next(request)

        # 2. Extract Authorization Token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # Let the standard security dependency injection handle missing tokens
            return await call_next(request)

        token = auth_header.split(" ")[1]
        payload = decode_jwt_token(token)
        if not payload:
            return JSONResponse(
                status_code=401,
                content={"detail": "Secure JWT session invalid or expired."}
            )

        user_id = int(payload.get("sub", 0))
        if not user_id:
            return await call_next(request)

        # 3. Create active database audit session
        async with AsyncSessionLocal() as session:
            # Query user core limits
            user_res = await session.execute(select(User).filter(User.id == user_id))
            user = user_res.scalars().first()
            if not user or not user.is_active:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Account deactivated or invalid user session."}
                )

            # A. Check subscription active status
            sub_res = await session.execute(
                select(Subscription)
                .filter(Subscription.user_id == user_id, Subscription.status == "active")
                .order_by(Subscription.created_at.desc())
            )
            active_sub = sub_res.scalars().first()
            
            # Auto-align user subscription status from tables if mismatched
            current_plan = active_sub.plan_type if active_sub else user.subscription

            # B. Block Report Generation for Free tier
            if is_report_route and current_plan == "free":
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Comprehensive PDF report generation is a Premium feature. Please upgrade your tier!"}
                )

            # C. Audit Daily AI Quotas for Free User
            if (is_ai_route or is_prediction_route) and current_plan == "free":
                today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                
                # Count today's usage logs
                count_res = await session.execute(
                    select(func.count(UsageLog.id))
                    .filter(
                        UsageLog.user_id == user_id,
                        UsageLog.created_at >= today_start,
                        UsageLog.feature_domain.in_(["ai_chat", "prediction"])
                    )
                )
                daily_requests_today = count_res.scalar() or 0
                
                if daily_requests_today >= 20:
                    return JSONResponse(
                        status_code=403,
                        content={
                            "detail": "Daily AI limit reached. Free tiers are capped at 20 AI/Prediction requests per day. Please upgrade to Premium!"
                        }
                    )

            # D. Audit Geoprocessing Credits depletion
            if user.credits <= 0 and current_plan == "free":
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": "Geoprocessing credit quota depleted (0 credits remaining). Please upgrade your subscription limit!"
                    }
                )

        # 4. Proceed with endpoint execution
        response = await call_next(request)

        # 5. Log activity and decrement credits upon successful 2xx execution
        if 200 <= response.status_code < 300:
            domain_label = "ai_chat" if is_ai_route else "prediction" if is_prediction_route else "reports"
            
            async with AsyncSessionLocal() as session:
                # Log usage record
                new_log = UsageLog(
                    user_id=user_id,
                    request_path=path,
                    request_method=method,
                    feature_domain=domain_label,
                    credits_consumed=1
                )
                session.add(new_log)

                # Re-query user to perform commit-safe update
                user_res = await session.execute(select(User).filter(User.id == user_id))
                db_user = user_res.scalars().first()
                if db_user:
                    # Update credits if free plan
                    if db_user.subscription == "free" and db_user.credits > 0:
                        db_user.credits -= 1

                    # Sync User Credit Record
                    credit_res = await session.execute(select(Credit).filter(Credit.user_id == user_id))
                    db_credit = credit_res.scalars().first()
                    if not db_credit:
                        db_credit = Credit(
                            user_id=user_id,
                            credit_limit=100,
                            credits_used=0,
                            credits_remaining=100
                        )
                        session.add(db_credit)
                    
                    db_credit.credits_used += 1
                    db_credit.credits_remaining = db_user.credits
                    db_credit.updated_at = datetime.datetime.utcnow()

                await session.commit()

        return response
