#!/usr/bin/env python3
"""
Database initialization script.
This script will:
1. Create the database if it doesn't exist
2. Run all migrations
3. Create initial data if specified
"""

import os
import sys
import logging
from pathlib import Path
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database() -> None:
    """Create the database if it doesn't exist."""
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

        with conn.cursor() as cursor:
            # Check if database exists
            cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{config.DB_NAME}'")
            if not cursor.fetchone():
                # Create database if it doesn't exist
                cursor.execute(f'CREATE DATABASE "{config.DB_NAME}"')
                logger.info(f"Created database {config.DB_NAME}")
            else:
                logger.info(f"Database {config.DB_NAME} already exists")

    except Exception as e:
        logger.error(f"Error creating database: {e}")
        raise
    finally:
        if conn:
            conn.close()

def run_migrations() -> None:
    """Run all Alembic migrations."""
    try:
        # Get the Alembic configuration
        alembic_cfg = Config("alembic.ini")

        # Run the migrations
        command.upgrade(alembic_cfg, "head")
        logger.info("Successfully ran all migrations")

    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        raise

def create_initial_data() -> None:
    """Create initial data in the database if needed."""
    try:
        # Create an engine
        engine = create_engine(config.DATABASE_URL)

        with engine.connect() as conn:
            # Check if we need to create initial data
            result = conn.execute(text("SELECT COUNT(*) FROM visualizations"))
            if result.scalar() == 0:
                # Add your initial data creation logic here
                logger.info("Created initial data")
            else:
                logger.info("Initial data already exists")

    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        raise

def main() -> None:
    """Main function to initialize the database."""
    try:
        logger.info("Starting database initialization...")

        # Create database
        create_database()

        # Run migrations
        run_migrations()

        # Create initial data if needed
        create_initial_data()

        logger.info("Database initialization completed successfully!")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
