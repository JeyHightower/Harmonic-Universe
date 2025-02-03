from sqlalchemy import create_engine
import logging
import os
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_database_connection():
    """Test database connection using configuration."""
    try:
        # Create an engine using the configuration
        engine = create_engine(config.DATABASE_URL)

        # Attempt to connect to the database
        with engine.connect() as connection:
            # Execute a simple query to verify connection
            result = connection.execute("SELECT 1")
            result.fetchone()
            logger.info("✅ Database connection successful!")
            return True

    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_database_connection()
