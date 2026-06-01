import asyncio
import httpx
import time
import os
import sys

# Add app directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

async def test_gemini():
    print("--- TESTING GEMINI CONNECTION ---")
    api_key = "AIzaSyCc8JiihTiy4ZldITomBlwTQ-t41im9DUE" # settings.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "Hello, this is a test. Answer with one word."}]}]
    }
    
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            duration = time.time() - start
            print(f"Gemini response status: {resp.status_code} in {duration:.2f} seconds")
            if resp.status_code == 200:
                print("Gemini response content:", resp.json())
            else:
                print("Gemini error content:", resp.text)
    except Exception as e:
        print(f"Gemini connection failed in {time.time() - start:.2f} seconds: {e}")

async def test_postgres():
    print("\n--- TESTING POSTGRES CONNECTION ---")
    start = time.time()
    try:
        from app.core.config import settings
        from sqlalchemy.ext.asyncio import create_async_engine
        
        # Parse database url
        db_url = settings.DATABASE_URL
        print(f"Connecting to database URL: {db_url}")
        
        engine = create_async_engine(db_url, echo=False)
        async with engine.connect() as conn:
            from sqlalchemy import text
            res = await conn.execute(text("SELECT version();"))
            row = res.fetchone()
            duration = time.time() - start
            print(f"Postgres connection succeeded in {duration:.2f} seconds")
            print("DB version:", row[0])
            
            # test a spatial query count
            res_geom = await conn.execute(text("SELECT count(*) FROM hospitals;"))
            count_h = res_geom.fetchone()[0]
            print(f"Hospitals count in DB: {count_h}")
            
    except Exception as e:
        print(f"Postgres connection failed in {time.time() - start:.2f} seconds: {e}")

async def main():
    await test_gemini()
    await test_postgres()

if __name__ == "__main__":
    asyncio.run(main())
