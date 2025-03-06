#!/usr/bin/env python
"""
Database initialization script.
This script will check database connectivity and create tables if needed.
"""
import os
import sys
import logging
from flask import Flask
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

def init_db():
    logger.info("Initializing database...")

    # Add current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.append(current_dir)
        logger.info(f"Added {current_dir} to Python path")

    try:
        from app import create_app
        from models import db

        # Create app context
        app = create_app()
        with app.app_context():
            # Check database connection
            try:
                logger.info("Checking database connection...")
                db.session.execute('SELECT 1')
                logger.info("Database connection successful")

                # Check if tables exist
                logger.info("Checking if tables need to be created...")
                db.create_all()
                logger.info("Tables created or already exist")

                return True
            except Exception as e:
                logger.error(f"Database initialization failed: {e}")
                return False
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during database initialization: {e}")
        return False

if __name__ == "__main__":
    success = init_db()
    if success:
        logger.info("Database initialization completed successfully")
        sys.exit(0)
    else:
        logger.error("Database initialization failed")
        sys.exit(1)
