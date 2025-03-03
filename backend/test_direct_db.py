#!/usr/bin/env python3
"""Test direct database user creation."""

from app.models.user import User
from app.db.session import get_db
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_direct_db_user_creation():
    """Test creating a user directly in the database."""
    # Generate unique user data
    unique_id = uuid.uuid4().hex[:8]
    username = f"db_user_{unique_id}"
    email = f"{username}@example.com"
    password = "Test123!"

    logger.info(f"Creating user directly in database: {username} ({email})")

    try:
        with get_db() as db:
            # Check if user already exists
            existing_user = db.query(User).filter_by(email=email).first()
            if existing_user:
                logger.warning(f"User with email {email} already exists")
                return False

            existing_user = db.query(User).filter_by(username=username).first()
            if existing_user:
                logger.warning(f"User with username {username} already exists")
                return False

            # Create new user
            user = User(
                email=email,
                username=username,
                is_active=True
            )
            user.set_password(password)

            # Add to database
            db.add(user)
            db.commit()

            logger.info(f"User created successfully with ID: {user.id}")

            # Verify user was created
            created_user = db.query(User).filter_by(email=email).first()
            if created_user:
                logger.info(f"User verified in database: {created_user.id}")

                # Test to_dict method
                user_dict = created_user.to_dict()
                logger.info(f"User dict: {user_dict}")

                return True
            else:
                logger.error("User not found in database after creation")
                return False

    except Exception as e:
        logger.error(f"Error creating user: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    test_direct_db_user_creation()
