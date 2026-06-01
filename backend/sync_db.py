import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def main():
    print("Connecting to PostgreSQL and synchronizing ALL User table columns...")
    async with AsyncSessionLocal() as session:
        try:
            # Add all columns safely if they do not exist
            alterations = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS industry VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription VARCHAR(100) DEFAULT 'free';",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
            ]
            
            for statement in alterations:
                print(f"Executing: {statement}")
                await session.execute(text(statement))
            
            # Backfill username for any existing users using their email prefix
            print("Backfilling usernames for legacy accounts...")
            await session.execute(text("""
                UPDATE users 
                SET username = split_part(email, '@', 1) 
                WHERE username IS NULL;
            """))
            
            # Alter column to be NOT NULL now that it is backfilled
            print("Enforcing username integrity restraints...")
            await session.execute(text("""
                ALTER TABLE users ALTER COLUMN username SET NOT NULL;
            """))

            await session.commit()
            print("\n" + "="*50)
            print("ALL USER SCHEMAS SYNCHRONIZED SUCCESSFULLY!")
            print("="*50 + "\n")

        except Exception as e:
            print(f"Migration error: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(main())
