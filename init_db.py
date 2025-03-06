#!/usr/bin/env python
"""
Database initialization script.
This script will check database connectivity and create tables if needed.
"""
import os
import sys
import logging
from flask_migrate import Migrate
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

def init_db():
    """Initialize the database by creating all tables."""
    logger.info("Initializing database...")

    # Add current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.append(current_dir)
        logger.info(f"Added {current_dir} to Python path")

    # Load environment variables
    load_dotenv()
    logger.info("Loaded environment variables")

    # Check for database type to handle differently
    db_url = os.environ.get('DATABASE_URL', '')
    is_postgres = db_url.startswith('postgresql')

    if is_postgres:
        # Try to import psycopg2 directly to check for issues
        try:
            import psycopg2
            logger.info(f"Using psycopg2 version: {psycopg2.__version__}")
        except ImportError:
            logger.error("Failed to import psycopg2. Trying to install psycopg2-binary...")
            import subprocess
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-cache-dir", "psycopg2-binary==2.9.9"])
                import psycopg2
                logger.info(f"Successfully installed psycopg2-binary: {psycopg2.__version__}")
            except Exception as e:
                logger.error(f"Failed to install psycopg2-binary: {e}")
                logger.info("Continuing without direct PostgreSQL operations")
                is_postgres = False
        except Exception as e:
            logger.error(f"Error importing psycopg2: {e}")
            logger.info("Continuing without direct PostgreSQL operations")
            is_postgres = False

    # Import app after setting up environment
    try:
        from app import create_app, db
        app = create_app()
        logger.info("Application created successfully")
    except Exception as e:
        logger.error(f"Error creating application: {e}")
        sys.exit(1)

    # Initialize database connection
    connection_successful = False
    with app.app_context():
        logger.info("Checking database connection...")
        try:
            db.engine.connect()
            logger.info("Database connection successful")
            connection_successful = True
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            logger.warning("Skipping database operations due to connection failure")

        if connection_successful and is_postgres:
            # Drop all tables with CASCADE - only for PostgreSQL
            try:
                logger.info("Dropping all existing tables...")
                db.session.execute('DROP SCHEMA public CASCADE')
                db.session.execute('CREATE SCHEMA public')
                db.session.execute('GRANT ALL ON SCHEMA public TO postgres')
                db.session.execute('GRANT ALL ON SCHEMA public TO public')
                db.session.commit()
                logger.info("Schema reset successfully")
            except Exception as e:
                logger.error(f"Error resetting schema: {e}")
                db.session.rollback()
                # Continue with table creation even if schema reset fails

        if connection_successful:
            # Create tables
            try:
                logger.info("Creating database tables...")
                db.create_all()
                logger.info("Tables created successfully")
            except Exception as e:
                logger.error(f"Error creating tables: {e}")

if __name__ == "__main__":
    try:
        init_db()
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)
