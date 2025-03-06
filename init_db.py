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

    # Import app after setting up environment
    from app import create_app, db

    app = create_app()

    # Initialize database connection
    with app.app_context():
        logger.info("Checking database connection...")
        try:
            # Try to import psycopg2 and log version info
            try:
                import psycopg2
                logger.info(f"Using psycopg2 version: {psycopg2.__version__}")
            except ImportError:
                logger.error("Failed to import psycopg2. Check if it's installed correctly.")
            except Exception as e:
                logger.error(f"Error importing psycopg2: {str(e)}")

            # Test database connection
            db.engine.connect()
            logger.info("Database connection successful")

            # Drop all tables with CASCADE
            logger.info("Dropping all existing tables...")
            try:
                db.session.execute('DROP SCHEMA public CASCADE')
                db.session.execute('CREATE SCHEMA public')
                db.session.execute('GRANT ALL ON SCHEMA public TO postgres')
                db.session.execute('GRANT ALL ON SCHEMA public TO public')
                db.session.commit()
                logger.info("Schema reset successfully")
            except Exception as e:
                logger.error(f"Error resetting schema: {str(e)}")
                db.session.rollback()
                # Continue with table creation even if schema reset fails

            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Tables created successfully")

            logger.info("Database initialization completed successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise

if __name__ == "__main__":
    init_db()
