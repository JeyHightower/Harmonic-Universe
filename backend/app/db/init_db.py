"""Database initialization script."""

import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.base import Base
from app.core.config import settings
from app.models import *  # noqa
from app.core.security import get_password_hash
from app.models.user import User
from app.models.universe import Universe

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def verify_all_models_registered():
    """Verify all models are properly registered with SQLAlchemy."""
    logger.info("Verifying model registration")
    from app.models import __all__ as model_names

    missing_models = []
    for model_name in model_names:
        model = globals().get(model_name)
        if not hasattr(model, '__table__'):
            missing_models.append(model_name)

    if missing_models:
        error_msg = f"The following models are not properly registered: {', '.join(missing_models)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    logger.info("All models are properly registered")

def init_db(db: Session, is_test: bool = False) -> None:
    """Initialize the database with required data."""
    logger.info(f"Initializing database (test mode: {is_test})")

    try:
        # Verify model registration
        verify_all_models_registered()

        # Create test user if in test mode
        if is_test:
            logger.info("Creating test user")
            test_user = User(
                email="test@example.com",
                username="testuser",
                full_name="Test User",
                is_active=True,
                is_superuser=False,
                email_verified=True,
                hashed_password=get_password_hash("test-password")
            )
            db.add(test_user)
            logger.info("Test user created successfully")

            # Create test universe
            logger.info("Creating test universe")
            test_universe = Universe(
                name="Test Universe",
                description="A test universe",
                physics_json={},
                music_parameters={},
                creator_id=1  # Will be the ID of test_user after commit
            )
            db.add(test_universe)
            logger.info("Test universe created successfully")

        # Create superuser if not exists
        superuser = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not superuser:
            logger.info("Creating superuser")
            superuser = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                username="admin",
                full_name="Admin User",
                is_active=True,
                is_superuser=True,
                email_verified=True,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            )
            db.add(superuser)
            logger.info("Superuser created successfully")

        db.commit()
        logger.info("Database initialization completed successfully")

    except SQLAlchemyError as e:
        logger.error(f"Database error during initialization: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error during initialization: {e}")
        db.rollback()
        raise

def verify_database_connection(db: Session) -> None:
    """Verify database connection and basic queries work."""
    logger.info("Verifying database connection")
    try:
        # Try a simple query
        db.execute("SELECT 1")
        logger.info("Database connection verified successfully")
    except Exception as e:
        logger.error(f"Database connection verification failed: {e}")
        raise

def create_initial_superuser(db: Session) -> None:
    """Create initial superuser if it doesn't exist."""
    logger.info("Checking for existing superuser")
    try:
        superuser = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not superuser:
            logger.info("Creating initial superuser")
            superuser_in = {
                "email": settings.FIRST_SUPERUSER_EMAIL,
                "username": "admin",
                "password": settings.FIRST_SUPERUSER_PASSWORD,
                "full_name": "Initial Admin",
                "is_superuser": True,
                "is_active": True,
                "email_verified": True
            }

            superuser = User(
                email=superuser_in["email"],
                username=superuser_in["username"],
                hashed_password=get_password_hash(superuser_in["password"]),
                full_name=superuser_in["full_name"],
                is_superuser=superuser_in["is_superuser"],
                is_active=superuser_in["is_active"],
                email_verified=superuser_in["email_verified"]
            )

            db.add(superuser)
            db.commit()
            logger.info("Initial superuser created successfully")
        else:
            logger.info("Superuser already exists")
    except Exception as e:
        logger.error(f"Failed to create initial superuser: {e}")
        db.rollback()
        raise
