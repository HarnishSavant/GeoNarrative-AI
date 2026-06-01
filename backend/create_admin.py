import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.db_models import User

# Use bcrypt hashing to match the auth.py login system
import bcrypt

def secure_hash_password(password: str) -> str:
    """Hash password using bcrypt — consistent with auth.py login verification."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def main():
    username = "admin"
    email = "admin@geonarrative.ai"
    password = "AdminPassword2026!"

    print("Connecting to PostgreSQL and bootstrapping admin user (Zero-Dependency Mode)...")
    async with AsyncSessionLocal() as session:
        try:
            # Check if user already exists
            result = await session.execute(select(User).filter((User.username == username) | (User.email == email)))
            user = result.scalars().first()

            hashed_pw = secure_hash_password(password)

            if user:
                print(f"User '{username}' already exists. Upgrading to Verified Admin...")
                user.role = "admin"
                user.is_verified = True
                user.is_active = True
                user.subscription = "premium_annual"
                user.credits = 9999
                user.hashed_password = hashed_pw
            else:
                print(f"Creating brand new Admin user '{username}'...")
                user = User(
                    full_name="Municipal Administrator",
                    username=username,
                    email=email,
                    hashed_password=hashed_pw,
                    industry="Government",
                    designation="Urban Planning Lead",
                    is_verified=True,
                    is_active=True,
                    role="admin",
                    credits=9999,
                    subscription="premium_annual"
                )
                session.add(user)
            
            await session.commit()
            print("\n" + "="*50)
            print("ADMIN USER BOOTSTRAPPED SUCCESSFULLY!")
            print(f"Username: {username}")
            print(f"Email:    {email}")
            print(f"Password: {password}")
            print("="*50 + "\n")

        except Exception as e:
            print(f"Error during bootstrapping: {e}", file=sys.stderr)
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(main())
