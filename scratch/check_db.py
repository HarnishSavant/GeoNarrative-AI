import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.database import engine
from sqlalchemy import text

async def check():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'buildings'"))
        columns = result.fetchall()
        print("Buildings columns:")
        for col in columns:
            print(col[0], col[1])

if __name__ == "__main__":
    asyncio.run(check())
