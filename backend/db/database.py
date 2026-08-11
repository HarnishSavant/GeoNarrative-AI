import asyncpg
from typing import Optional
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        try:
            logger.info("Connecting to PostgreSQL/PostGIS...")
            self.pool = await asyncpg.create_pool(
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD,
                database=settings.POSTGRES_DB,
                host=settings.POSTGRES_SERVER,
                port=settings.POSTGRES_PORT,
                min_size=2,
                max_size=10
            )
            logger.info("Database connection pool established.")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise e

    async def disconnect(self):
        if self.pool:
            logger.info("Closing database connection pool...")
            await self.pool.close()
            logger.info("Database connection closed.")

db = Database()

async def get_db_pool() -> asyncpg.Pool:
    if db.pool is None:
        raise Exception("Database pool is not initialized")
    return db.pool
