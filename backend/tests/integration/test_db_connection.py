"""
Test database connection configuration.
"""

import pytest
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.core.config.test_settings import TestSettings
from app.db.session import get_sync_db_url

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get test settings
settings = TestSettings()

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
