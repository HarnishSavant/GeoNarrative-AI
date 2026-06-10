import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.db_models import User
from main import app

@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Create dynamic SQLite async testing engine (bypasses active PostgreSQL PostGIS checks for core unit tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})

from sqlalchemy import event
@event.listens_for(engine.sync_engine, "connect")
def register_sqlite_functions(dbapi_connection, connection_record):
    # Register mock PostGIS functions on SQLite connection
    dbapi_connection.create_function("ST_Contains", 2, lambda a, b: 1)
    dbapi_connection.create_function("ST_Distance", 2, lambda a, b: 0.0)
    dbapi_connection.create_function("ST_DWithin", 3, lambda a, b, c: 1)
    dbapi_connection.create_function("ST_Area", 1, lambda a: 12.5)
    dbapi_connection.create_function("ST_Transform", 2, lambda a, b: a)
    dbapi_connection.create_function("ST_GeomFromText", 1, lambda a: a)
    dbapi_connection.create_function("ST_GeomFromText", 2, lambda a, b: a)

TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    expire_on_commit=False,
    bind=engine, 
    class_=AsyncSession
)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def init_test_db():
    tables = [User.__table__]
    # Setup test tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, tables=tables)
    yield
    # Teardown test tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all, tables=tables)

@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    # Override standard database dependency injection
    async def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
