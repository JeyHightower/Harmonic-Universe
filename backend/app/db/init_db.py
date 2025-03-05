"""Database initialization module."""

import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError, OperationalError

from backend.app.core.config import settings
from backend.app.db.session import engine as default_engine, init_engine, Base
from backend.app.models.core.user import User
from backend.app.models.organization.organization import Organization, Role, Workspace, Permission
from backend.app.seeds.demo_user import create_demo_user

logger = logging.getLogger(__name__)

def init_db(db: Session, is_test: bool = False) -> None:
    """Initialize database with schema and initial data."""
    try:
        # Initialize the appropriate engine
        if is_test:
            # Use test database URL
            database_url = "sqlite:///test.db"
            engine = init_engine(database_url)
        else:
            engine = default_engine

        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Created database tables")

        # Verify database connection
        db.execute(text("SELECT 1"))
        logger.info("Database connection verified")

        # Add any initial data here if needed
        create_initial_data(db)

        # Create demo user if not in test mode
        if not is_test:
            create_demo_user()
            logger.info("Demo user setup completed")

        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def create_initial_data(db: Session) -> None:
    """Create initial data in database if needed."""
    try:
        # Check if we need to create initial data
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        if result.scalar() == 0:
            # Create default organization first
            default_org = Organization(
                name="Harmonic Universe",
                description="Default organization for Harmonic Universe",
                is_active=True
            )
            db.add(default_org)
            db.flush()  # Flush to get the organization ID

            # Create admin user
            admin_user = User(
                email="admin@harmonicuniverse.com",
                username="admin",
                is_active=True
            )
            admin_user.password = "admin123"  # This will use the password property setter
            db.add(admin_user)
            db.flush()  # Flush to get the user ID

            # Create default roles
            admin_role = Role(
                name="Admin",
                description="Administrator role with full access",
                permissions=[Permission.READ.value, Permission.WRITE.value, Permission.ADMIN.value],
                organization_id=default_org.id
            )
            user_role = Role(
                name="User",
                description="Standard user role",
                permissions=[Permission.READ.value],
                organization_id=default_org.id
            )
            db.add(admin_role)
            db.add(user_role)
            db.flush()

            # Create default workspace
            default_workspace = Workspace(
                name="Default Workspace",
                description="Default workspace for new users",
                organization_id=default_org.id
            )
            db.add(default_workspace)

            # Assign admin role to admin user
            admin_user.roles = [admin_role]

            # Commit all changes
            db.commit()
            logger.info("Created initial data")
        else:
            logger.info("Initial data already exists")
    except Exception as e:
        logger.error(f"Unexpected error creating initial data: {str(e)}")
        db.rollback()
        raise
