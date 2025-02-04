"""
Test database connection configuration.
"""

import pytest
import logging
<<<<<<< HEAD
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.core.config.test_settings import TestSettings
from app.db.session import get_sync_db_url
=======
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import AsyncSessionLocal
>>>>>>> eff55919 (fixed core db functionalithy and async sqlalchemy operations are workink)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get test settings
settings = TestSettings()

<<<<<<< HEAD
def get_test_engine():
    """Create test database engine."""
    db_url = get_sync_db_url()
    logger.info(f"Creating test engine with URL: {db_url}")

    if 'sqlite' in db_url.lower():
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )
    else:
        return create_engine(db_url, pool_pre_ping=True)

@pytest.fixture(scope="function")
def test_engine():
    """Test database engine fixture."""
    engine = get_test_engine()
    yield engine
    engine.dispose()

def test_db_connection(test_engine):
    """Test database connection."""
    try:
        # Test connection with explicit query
        with test_engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            assert result == 1
            logger.info("✅ Successfully connected to the database!")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        raise

if __name__ == "__main__":
    pytest.main([__file__])
=======
@pytest.mark.asyncio
async def test_can_connect_to_db():
    """Test that we can connect to the database."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            assert result is not None
            row = result.fetchone()
            assert row[0] == 1
            logger.info("Successfully connected to the database")
    except Exception as e:
        logger.error(f"Failed to connect to the database: {str(e)}")
        raise

@pytest.mark.asyncio
async def test_db_session():
    """Test that we can create a database session and execute a query."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            assert result is not None
            row = result.fetchone()
            assert row[0] == 1
            logger.info("Successfully executed query in database session")
    except Exception as e:
        logger.error(f"Failed to execute query in database session: {str(e)}")
        raise
>>>>>>> eff55919 (fixed core db functionalithy and async sqlalchemy operations are workink)
