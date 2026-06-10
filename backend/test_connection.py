import asyncio
import httpx
import time
import os
import sys

# Add app directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Load .env
from dotenv import load_dotenv
load_dotenv()

async def test_gemini():
    print("--- TESTING GEMINI CONNECTION ---")
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        print("  ERROR: GEMINI_API_KEY not found in .env")
        return None
    print(f"  Key prefix: {api_key[:6]}... (length: {len(api_key)})")
    model = "gemini-2.5-flash"
    
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "Hello, this is a test. Answer with one word."}]}]
    }
    start = time.time()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            duration = time.time() - start
            if resp.status_code == 200:
                print(f"  SUCCESS! HTTPX works in {duration:.2f}s")
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                print(f"  Response: {text}")
                return model
            elif resp.status_code == 403:
                print(f"  API key rejected (403): {resp.text[:200]}")
            else:
                print(f"  HTTP {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"  Exception: {e}")
    
    print("\n  GEMINI FAILED! Check your API key and network connection.")
    return None

async def test_postgres():
    print("\n--- TESTING POSTGRES CONNECTION ---")
    start = time.time()
    try:
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import create_async_engine
        
        # Parse database url
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        print(f"Connecting to database...")
        
        engine = create_async_engine(db_url, echo=False)
        async with engine.connect() as conn:
            from sqlalchemy import text
            res = await conn.execute(text("SELECT version();"))
            row = res.fetchone()
            duration = time.time() - start
            print(f"Postgres connection succeeded in {duration:.2f} seconds")
            print("DB version:", row[0])
            
    except Exception as e:
        print(f"Postgres connection failed in {time.time() - start:.2f} seconds: {e}")

async def main():
    working_model = await test_gemini()
    if working_model:
        print(f"\n=== RECOMMENDED MODEL: {working_model} ===")
    await test_postgres()

if __name__ == "__main__":
    asyncio.run(main())
