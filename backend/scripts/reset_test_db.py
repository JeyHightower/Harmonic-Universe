"""
Reset test database script.
This script clears all data from the test database to ensure clean test runs.
"""

import os
import sys
import logging

# Add parent directory to path to import backend.app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.db.base_class import Base
from backend.app.db.session import engine, SessionLocal
from backend.app.core.config import config
from backend.app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_test_database():
    """Reset the test database by dropping and recreating all tables."""
    try:
        # Use the test configuration
        test_config = config['testing']

        # Confirm we're working with the test database
        db_url = os.environ.get('DATABASE_URL_TEST') or test_config.SQLALCHEMY_DATABASE_URI
        if 'test' not in db_url.lower():
            logger.error("Refusing to reset non-test database. Database URL must contain 'test'.")
            return False

        logger.info(f"Resetting test database: {db_url}")

        # Drop and recreate all tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        # Create a test user
        db = SessionLocal()
        test_user = User(
            email="admin@example.com",
            username="admin",
            is_active=True,
            is_verified=True
        )
        test_user.set_password("admin123")
        db.add(test_user)
        db.commit()
        db.close()

        logger.info("Test database reset successfully.")
        return True
    except Exception as e:
        logger.error(f"Error resetting test database: {str(e)}")
        return False

if __name__ == "__main__":
    success = reset_test_database()
    sys.exit(0 if success else 1)
