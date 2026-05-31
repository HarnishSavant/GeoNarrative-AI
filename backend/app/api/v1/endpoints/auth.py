import datetime
import hmac
import base64
import json
import time
import hashlib
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from app.core.database import get_db
from app.models.db_models import User as DBUser
from app.services.smtp_service import SMTPService
from pydantic import BaseModel

router = APIRouter()

# =====================================================================
#   CRYPTOGRAPHIC UTILITIES (SECURE & COMPATIBLE)
# =====================================================================

SECRET_KEY = os.getenv("SECRET_KEY", "geonarrative_ai_enterprise_super_secret_key_2026")

def hash_password(password: str) -> str:
    """Secures password using standard PBKDF2-HMAC-SHA256 with urandom salt."""
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac(
        "sha256", 
        password.encode("utf-8"), 
        salt.encode("utf-8"), 
        100000
    ).hex()
    return f"{salt}:{key}"

def verify_password(password: str, hashed: str) -> bool:
    """Verifies standard PBKDF2 password hashes."""
    try:
        salt, key = hashed.split(":")
        check_key = hashlib.pbkdf2_hmac(
            "sha256", 
            password.encode("utf-8"), 
            salt.encode("utf-8"), 
            100000
        ).hex()
        return hmac.compare_digest(check_key.encode(), key.encode())
    except ValueError:
        return False

def create_jwt_token(data: dict, expires_in: int = 86400) -> str:
    """Encodes custom signed JWT token using base64 URL specs."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256)
    signature_b64 = base64.urlsafe_b64encode(signature.digest()).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_jwt_token(token: str) -> Optional[dict]:
    """Decodes and validates cryptographically signed JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts
        
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected_signature = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256)
        expected_signature_b64 = base64.urlsafe_b64encode(expected_signature.digest()).decode().rstrip("=")
        
        if not hmac.compare_digest(expected_signature_b64.encode(), signature_b64.encode()):
            return None
            
        # Pad base64 and decode
        pad = len(payload_b64) % 4
        if pad:
            payload_b64 += "=" * (4 - pad)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
        
        if payload.get("exp", 0) < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None

# =====================================================================
#   VALIDATION SCHEMAS
# =====================================================================

class RegisterRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str
    confirm_password: str
    industry: str
    designation: str

class LoginRequest(BaseModel):
    login: str # email or username
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str
    confirm_new_password: str

class StatusUpdateRequest(BaseModel):
    is_active: bool

class SubscriptionUpdateRequest(BaseModel):
    subscription: str # free, basic, premium
    credits: int

# =====================================================================
#   DEPENDENCIES (SECURE SESSION RETRIEVALS)
# =====================================================================

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> DBUser:
    """Dependency injection to fetch the authenticated user session."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    payload = decode_jwt_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    result = await db.execute(select(DBUser).filter(DBUser.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user session")
        
    return user

async def get_admin_user(current_user: DBUser = Depends(get_current_user)) -> DBUser:
    """Dependency injection to verify administrative permissions."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user

# =====================================================================
#   AUTHENTICATION ROUTERS
# =====================================================================

@router.post("/register")
async def register_user(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Registers a new user and dispatches account activation verification emails."""
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    # Check duplicate email
    res_email = await db.execute(select(DBUser).filter(DBUser.email == req.email.strip().lower()))
    if res_email.scalars().first():
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    # Check duplicate username
    res_user = await db.execute(select(DBUser).filter(DBUser.username == req.username.strip().lower()))
    if res_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username is already taken")
        
    # Secure token creation
    verification_token = os.urandom(24).hex()
    
    # Check if this is the first user overall. If yes, automatically make them admin!
    res_count = await db.execute(select(func.count(DBUser.id)))
    total_users = res_count.scalar()
    assigned_role = "admin" if total_users == 0 else "user"

    new_user = DBUser(
        full_name=req.full_name,
        username=req.username.strip().lower(),
        email=req.email.strip().lower(),
        hashed_password=hash_password(req.password),
        industry=req.industry,
        designation=req.designation,
        is_verified=False,
        verification_token=verification_token,
        is_active=True,
        role=assigned_role,
        credits=500 if assigned_role == "admin" else 100, # default signup credits
        subscription="premium" if assigned_role == "admin" else "free"
    )
    
    db.add(new_user)
    await db.commit()
    
    # Send verification email link (async fallback logs local outbox file)
    SMTPService.send_verification_email(new_user.email, new_user.username, verification_token)
    
    return {
        "status": "success",
        "message": "User registered successfully. An activation email has been dispatched.",
        "assigned_role": assigned_role
    }

@router.get("/verify")
async def verify_account(token: str = Query(...), email: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Verifies signup tokens and activates account status."""
    res = await db.execute(select(DBUser).filter(DBUser.email == email.strip().lower()))
    user = res.scalars().first()
    
    if not user or user.verification_token != token:
        raise HTTPException(status_code=400, detail="Invalid verification link or parameters")
        
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    
    return {"status": "success", "message": "Your email address has been successfully verified! You can now log in."}

@router.post("/login")
async def login_user(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Logs in users, returns cryptographically signed JWT token."""
    login_str = req.login.strip().lower()
    
    # Query either username or email
    res = await db.execute(
        select(DBUser).filter((DBUser.email == login_str) | (DBUser.username == login_str))
    )
    user = res.scalars().first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username, email, or password")
        
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email address before logging in.")
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact support.")
        
    # Generate token payload
    token_payload = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    access_token = create_jwt_token(token_payload, expires_in=86400) # 1 day session
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "industry": user.industry,
            "designation": user.designation,
            "credits": user.credits,
            "subscription": user.subscription
        }
    }

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Triggers password reset token generation and dispatches email link."""
    res = await db.execute(select(DBUser).filter(DBUser.email == req.email.strip().lower()))
    user = res.scalars().first()
    
    if not user:
        # Return success anyway to avoid user enumeration security attacks
        return {"status": "success", "message": "If the account exists, a password reset link has been sent."}
        
    reset_token = os.urandom(24).hex()
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    
    await db.commit()
    
    # Dispatch email
    SMTPService.send_password_reset_email(user.email, user.username, reset_token)
    
    return {"status": "success", "message": "If the account exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Validates reset token and overwrites new passwords."""
    if req.new_password != req.confirm_new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    res = await db.execute(select(DBUser).filter(DBUser.email == req.email.strip().lower()))
    user = res.scalars().first()
    
    if not user or user.reset_token != req.token:
        raise HTTPException(status_code=400, detail="Invalid token or email bounds")
        
    if not user.reset_token_expiry or user.reset_token_expiry < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")
        
    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    
    await db.commit()
    
    return {"status": "success", "message": "Your password has been reset successfully! You can now log in."}

@router.get("/me")
async def get_my_profile(current_user: DBUser = Depends(get_current_user)):
    """Returns profile context for the active logged-in JWT user session."""
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "industry": current_user.industry,
        "designation": current_user.designation,
        "credits": current_user.credits,
        "subscription": current_user.subscription,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }

# =====================================================================
#   ADMINISTRATIVE CONTROL PANELS
# =====================================================================

@router.get("/admin/users")
async def admin_get_users(
    search: Optional[str] = Query(None),
    role_filter: Optional[str] = Query(None),
    sub_filter: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: DBUser = Depends(get_admin_user)
):
    """Admin dashboard API to search, filter, and fetch municipal user records."""
    query = select(DBUser)
    
    if search:
        search_like = f"%{search.strip().lower()}%"
        query = query.filter(
            (DBUser.full_name.ilike(search_like)) | 
            (DBUser.email.ilike(search_like)) | 
            (DBUser.username.ilike(search_like)) |
            (DBUser.industry.ilike(search_like)) |
            (DBUser.designation.ilike(search_like))
        )
        
    if role_filter:
        query = query.filter(DBUser.role == role_filter.strip())
        
    if sub_filter:
        query = query.filter(DBUser.subscription == sub_filter.strip())
        
    query = query.order_by(DBUser.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "industry": u.industry,
            "designation": u.designation,
            "credits": u.credits,
            "subscription": u.subscription,
            "is_verified": u.is_verified,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.put("/admin/users/{user_id}/status")
async def admin_toggle_user_status(
    user_id: int,
    req: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: DBUser = Depends(get_admin_user)
):
    """Admin API to activate or deactivate user accounts instantly."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own sessions")
        
    res = await db.execute(select(DBUser).filter(DBUser.id == user_id))
    user = res.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User record not found")
        
    user.is_active = req.is_active
    await db.commit()
    
    return {
        "status": "success",
        "message": f"User status changed to {'active' if req.is_active else 'inactive'} successfully."
    }

@router.put("/admin/users/{user_id}/subscription")
async def admin_update_subscription(
    user_id: int,
    req: SubscriptionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: DBUser = Depends(get_admin_user)
):
    """Admin API to manage user credit allotments and SaaS subscription classes."""
    res = await db.execute(select(DBUser).filter(DBUser.id == user_id))
    user = res.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User record not found")
        
    sub_lower = req.subscription.strip().lower()
    if sub_lower not in ["free", "basic", "premium"]:
        raise HTTPException(status_code=400, detail="Invalid subscription class")
        
    user.subscription = sub_lower
    user.credits = req.credits
    await db.commit()
    
    return {
        "status": "success",
        "message": "User subscription class and credit limit adjusted successfully."
    }

@router.get("/admin/analytics")
async def admin_get_analytics(
    db: AsyncSession = Depends(get_db),
    admin: DBUser = Depends(get_admin_user)
):
    """Admin API supplying municipal portal stats and SaaS distribution analytics."""
    res_users = await db.execute(select(func.count(DBUser.id)))
    total_users = res_users.scalar() or 0
    
    res_verified = await db.execute(select(func.count(DBUser.id)).filter(DBUser.is_verified == True))
    verified_users = res_verified.scalar() or 0
    
    res_credits = await db.execute(select(func.sum(DBUser.credits)))
    total_credits_active = res_credits.scalar() or 0
    
    # Subscriptions counts
    res_free = await db.execute(select(func.count(DBUser.id)).filter(DBUser.subscription == "free"))
    count_free = res_free.scalar() or 0
    
    res_basic = await db.execute(select(func.count(DBUser.id)).filter(DBUser.subscription == "basic"))
    count_basic = res_basic.scalar() or 0
    
    res_prem = await db.execute(select(func.count(DBUser.id)).filter(DBUser.subscription == "premium"))
    count_prem = res_prem.scalar() or 0
    
    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "active_credits": total_credits_active,
        "subscriptions": {
            "free": count_free,
            "basic": count_basic,
            "premium": count_prem
        },
        "system_status": "operational"
    }
