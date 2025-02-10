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

from app.core.config import config
from app.db.session import init_engine
from app.db.base import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database(database_url: str) -> None:
    """Create database if it doesn't exist."""
    parsed = database_url.split('/')
    db_name = parsed[-1]
    db_url_without_name = '/'.join(parsed[:-1])

    try:
        # Connect to postgres database to create new database
        conn = psycopg2.connect(f"{db_url_without_name}/postgres")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()

        if not exists:
            # Create database
            cur.execute(f'CREATE DATABASE "{db_name}"')
            logger.info(f"Created database: {db_name}")
        else:
            logger.info(f"Database already exists: {db_name}")

        cur.close()
        conn.close()

    except Exception as e:
        logger.error(f"Error creating database: {str(e)}")
        raise

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
        engine = create_engine(config['development'].SQLALCHEMY_DATABASE_URI)

        with engine.connect() as conn:
            # Check if we need to create initial data
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            if result.scalar() == 0:
                # Add your initial data creation logic here
                logger.info("Created initial data")
            else:
                logger.info("Initial data already exists")

    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        raise

def init_database(config_name: str = 'development') -> None:
    """Initialize database with all tables."""
    try:
        # Get configuration
        conf = config[config_name]
        database_url = conf.SQLALCHEMY_DATABASE_URI

        # Create database if it doesn't exist
        create_database(database_url)

        # Initialize engine
        engine = init_engine(database_url)

        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Successfully initialized database schema")

    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def main():
    """Main entry point."""
    import argparse
    parser = argparse.ArgumentParser(description='Initialize database')
    parser.add_argument('--env', choices=['development', 'testing', 'production'],
                      default='development', help='Environment to initialize')
    args = parser.parse_args()

    try:
        init_database(args.env)
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
