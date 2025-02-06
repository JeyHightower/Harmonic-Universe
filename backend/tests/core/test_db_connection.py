"""
Test database connection configuration.
"""

import pytest
import logging
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import AsyncSessionLocal

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
