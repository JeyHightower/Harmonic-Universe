"""Database test fixtures."""

import pytest
from typing import Dict, Any, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, AsyncEngine
from sqlalchemy import text
from app.db.session import async_engine, AsyncSessionLocal

@pytest.fixture
async def test_db_engine() -> AsyncEngine:
    """Get test database engine."""
    return async_engine

@pytest.fixture
async def test_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get test database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()

@pytest.fixture
async def test_db_transaction(test_db_session: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    """Create a test transaction."""
    async with test_db_session.begin():
        yield test_db_session

@pytest.fixture
async def test_db_tables(test_db_session: AsyncSession) -> list[str]:
    """Get list of all tables in test database."""
    result = await test_db_session.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public'"
    ))
    return [row[0] for row in result]

@pytest.fixture
async def test_db_connection_info(test_db_engine: AsyncEngine) -> Dict[str, Any]:
    """Get test database connection information."""
    return {
        "url": str(test_db_engine.url),
        "driver": test_db_engine.driver,
        "dialect": test_db_engine.dialect.name,
        "pool_size": test_db_engine.pool.size(),
        "max_overflow": test_db_engine.pool.max_overflow
    }
