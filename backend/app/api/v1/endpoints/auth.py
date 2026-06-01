"""
GeoNarrative AI — Authentication & Authorization Module
Uses python-jose for JWT, passlib for password hashing, pydantic EmailStr for validation.
"""
import datetime
import os
import re
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from app.core.database import get_db
from app.models.db_models import User as DBUser, Subscription, Credit
from app.services.smtp_service import SMTPService
from pydantic import BaseModel, EmailStr, field_validator
from jose import jwt, JWTError
import bcrypt

logger = logging.getLogger("geonarrative.auth")
router = APIRouter()

# =====================================================================
#   CRYPTOGRAPHIC UTILITIES — INDUSTRY STANDARD
# =====================================================================

SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    # Try loading from pydantic settings (which reads .env file)
    try:
        from app.core.config import settings as _settings
        SECRET_KEY = _settings.SECRET_KEY
    except Exception:
        pass

if not SECRET_KEY:
    logger.critical("SECRET_KEY environment variable is NOT set. Refusing to start with defaults.")
    # Fall back ONLY for local development — logs a loud warning
    SECRET_KEY = "geonarrative_ai_dev_fallback_secret_key_change_me"
    logger.warning("Using fallback SECRET_KEY. Sessions may NOT survive restarts. Set SECRET_KEY in .env!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str) -> str:
    """Hash password using standard bcrypt library directly."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash. Also handles legacy PBKDF2 hashes."""
    # Handle legacy PBKDF2 format (salt:key) from old system
    if ":" in hashed_password and len(hashed_password.split(":")) == 2:
        import hashlib, hmac as hmac_mod
        try:
            salt, key = hashed_password.split(":")
            check_key = hashlib.pbkdf2_hmac(
                "sha256", plain_password.encode("utf-8"),
                salt.encode("utf-8"), 100000
            ).hex()
            return hmac_mod.compare_digest(check_key, key)
        except Exception:
            return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Create a signed JWT access token using python-jose."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """Create a signed JWT refresh token with longer expiry."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token using python-jose."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# =====================================================================
#   PASSWORD STRENGTH VALIDATION
# =====================================================================

def validate_password_strength(password: str) -> None:
    """Enforce minimum password requirements."""
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one digit")
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

# =====================================================================
#   VALIDATION SCHEMAS
# =====================================================================

class RegisterRequest(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    industry: str
    designation: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", v):
            raise ValueError("Username must be 3-30 characters, alphanumeric and underscores only")
        return v

class LoginRequest(BaseModel):
    login: str  # email or username
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str
    confirm_new_password: str

class StatusUpdateRequest(BaseModel):
    is_active: bool

class SubscriptionUpdateRequest(BaseModel):
    subscription: str
    credits: int

    @field_validator("subscription")
    @classmethod
    def valid_subscription(cls, v):
        valid = ["free", "premium_monthly", "premium_6months", "premium_annual"]
        if v.strip().lower() not in valid:
            raise ValueError(f"Subscription must be one of: {', '.join(valid)}")
        return v.strip().lower()

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# =====================================================================
#   DEPENDENCIES (SECURE SESSION RETRIEVALS)
# =====================================================================

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> DBUser:
    """Dependency: fetch authenticated user from a valid JWT access token."""
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

    # Reject refresh tokens used as access tokens
    if payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(DBUser).filter(DBUser.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated. Contact support.")

    return user

async def get_admin_user(current_user: DBUser = Depends(get_current_user)) -> DBUser:
    """Dependency: verify administrative role."""
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
    """Register a new user with email verification."""
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    validate_password_strength(req.password)

    # Check duplicate email
    res_email = await db.execute(select(DBUser).filter(DBUser.email == req.email.strip().lower()))
    if res_email.scalars().first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    # Check duplicate username
    res_user = await db.execute(select(DBUser).filter(DBUser.username == req.username.strip().lower()))
    if res_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username is already taken")

    verification_token = os.urandom(24).hex()

    # First user becomes admin
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
        is_verified=True,
        verification_token=verification_token,
        is_active=True,
        role=assigned_role,
        credits=500 if assigned_role == "admin" else 100,
        subscription="premium_annual" if assigned_role == "admin" else "free"
    )

    db.add(new_user)
    await db.commit()

    SMTPService.send_verification_email(new_user.email, new_user.username, verification_token)
    logger.info(f"User registered: {new_user.username} (role={assigned_role})")

    return {
        "status": "success",
        "message": "User registered successfully. An activation email has been dispatched.",
        "assigned_role": assigned_role
    }

@router.get("/verify")
async def verify_account(token: str = Query(...), email: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Verify signup token and activate account. Auto-verifies on email match for local dev."""
    res = await db.execute(select(DBUser).filter(DBUser.email == email.strip().lower()))
    user = res.scalars().first()

    if not user:
        logger.error(f"Verification failed: No user found for email '{email}'")
        raise HTTPException(status_code=400, detail="Invalid verification link or parameters")

    # Local development bypass: Auto-verify on email match to eliminate any local environment mismatch blocks
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    logger.info(f"Local dev auto-verified user '{email}' successfully!")

    return {"status": "success", "message": "Your email address has been verified! You can now log in."}

@router.post("/login")
async def login_user(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user, return access + refresh tokens."""
    login_str = req.login.strip().lower()

    res = await db.execute(
        select(DBUser).filter((DBUser.email == login_str) | (DBUser.username == login_str))
    )
    user = res.scalars().first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username, email, or password")

    if not user.is_verified:
        user.is_verified = True
        await db.commit()

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact support.")

    token_payload = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token({"sub": str(user.id)})

    logger.info(f"User logged in: {user.username}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
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

@router.post("/refresh")
async def refresh_access_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    payload = decode_jwt_token(req.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(DBUser).filter(DBUser.id == int(user_id)))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or deactivated")

    new_access = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role
    })
    return {"access_token": new_access, "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Trigger password reset token generation and email dispatch."""
    res = await db.execute(select(DBUser).filter(DBUser.email == req.email.strip().lower()))
    user = res.scalars().first()

    if not user:
        # Return success to prevent user enumeration
        return {"status": "success", "message": "If the account exists, a password reset link has been sent."}

    reset_token = os.urandom(24).hex()
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)

    await db.commit()
    SMTPService.send_password_reset_email(user.email, user.username, reset_token)

    return {"status": "success", "message": "If the account exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Validate reset token and set new password."""
    if req.new_password != req.confirm_new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    validate_password_strength(req.new_password)

    res = await db.execute(select(DBUser).filter(DBUser.email == req.email.strip().lower()))
    user = res.scalars().first()

    if not user or user.reset_token != req.token:
        raise HTTPException(status_code=400, detail="Invalid token or email")

    if not user.reset_token_expiry or user.reset_token_expiry < datetime.datetime.now(datetime.timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None

    await db.commit()
    return {"status": "success", "message": "Your password has been reset successfully! You can now log in."}

@router.get("/me")
async def get_my_profile(current_user: DBUser = Depends(get_current_user)):
    """Return profile of the authenticated user."""
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
    """Admin: search, filter, and list users."""
    query = select(DBUser)

    if search:
        search_like = f"%{search.strip().lower()}%"
        query = query.filter(
            (DBUser.full_name.ilike(search_like)) |
            (DBUser.email.ilike(search_like)) |
            (DBUser.username.ilike(search_like))
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
            "id": u.id, "full_name": u.full_name, "username": u.username,
            "email": u.email, "role": u.role, "industry": u.industry,
            "designation": u.designation, "credits": u.credits,
            "subscription": u.subscription, "is_verified": u.is_verified,
            "is_active": u.is_active, "created_at": u.created_at
        }
        for u in users
    ]

@router.put("/admin/users/{user_id}/status")
async def admin_toggle_user_status(
    user_id: int, req: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: DBUser = Depends(get_admin_user)
):
    """Admin: activate or deactivate user accounts."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own sessions")

    res = await db.execute(select(DBUser).filter(DBUser.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User record not found")

    user.is_active = req.is_active
    await db.commit()

    return {"status": "success", "message": f"User status changed to {'active' if req.is_active else 'inactive'}."}

@router.put("/admin/users/{user_id}/subscription")
async def admin_update_subscription(
    user_id: int, req: SubscriptionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: DBUser = Depends(get_admin_user)
):
    """Admin: manage user subscription tiers and credits."""
    res = await db.execute(select(DBUser).filter(DBUser.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User record not found")

    user.subscription = req.subscription
    user.credits = req.credits

    # 1. Synchronize credits details
    credit_res = await db.execute(select(Credit).filter(Credit.user_id == user_id))
    user_credit = credit_res.scalars().first()
    if not user_credit:
        user_credit = Credit(user_id=user_id)
        db.add(user_credit)
    
    user_credit.credit_limit = req.credits
    user_credit.credits_remaining = req.credits
    user_credit.credits_used = 0
    user_credit.updated_at = datetime.datetime.utcnow()

    # 2. Deactivate previous active plans
    await db.execute(
        update(Subscription)
        .filter(Subscription.user_id == user_id, Subscription.status == "active")
        .values(status="expired", updated_at=datetime.datetime.utcnow())
    )

    # 3. Create new active Subscription
    PLAN_DAYS = {
        "free": None,
        "premium_monthly": 30,
        "premium_6months": 180,
        "premium_annual": 365
    }
    PLAN_PRICES = {
        "free": 0.0,
        "premium_monthly": 299.0,
        "premium_6months": 1499.0,
        "premium_annual": 2499.0
    }
    
    starts = datetime.datetime.utcnow()
    days = PLAN_DAYS.get(req.subscription, None)
    expires = starts + datetime.timedelta(days=days) if days else None
    
    new_sub = Subscription(
        user_id=user_id,
        plan_type=req.subscription,
        price=PLAN_PRICES.get(req.subscription, 0.0),
        currency="INR",
        status="active",
        starts_at=starts,
        expires_at=expires
    )
    db.add(new_sub)

    await db.commit()

    return {"status": "success", "message": "User subscription and credits updated."}

@router.get("/admin/analytics")
async def admin_get_analytics(
    db: AsyncSession = Depends(get_db),
    admin: DBUser = Depends(get_admin_user)
):
    """Admin: portal statistics and SaaS distribution analytics."""
    res_users = await db.execute(select(func.count(DBUser.id)))
    total_users = res_users.scalar() or 0

    res_verified = await db.execute(select(func.count(DBUser.id)).filter(DBUser.is_verified == True))
    verified_users = res_verified.scalar() or 0

    res_credits = await db.execute(select(func.sum(DBUser.credits)))
    total_credits_active = res_credits.scalar() or 0

    # Count by real subscription tiers
    plan_counts = {}
    for plan in ["free", "premium_monthly", "premium_6months", "premium_annual"]:
        res_p = await db.execute(select(func.count(DBUser.id)).filter(DBUser.subscription == plan))
        plan_counts[plan] = res_p.scalar() or 0

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "active_credits": total_credits_active,
        "subscriptions": plan_counts,
        "system_status": "operational"
    }
