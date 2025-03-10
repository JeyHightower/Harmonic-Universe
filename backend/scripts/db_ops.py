#!/usr/bin/env python3
"""Database operations script."""

import os
import sys
import click
import logging
from pathlib import Path
from urllib.parse import urlparse
from sqlalchemy.exc import ProgrammingError, OperationalError

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings
from backend.app.db.init_db import init_db
from backend.app.db.session import init_engine
from alembic.config import Config
from alembic import command

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_session(database_url: str = None):
    """Create a database session."""
    if database_url is None:
        database_url = str(settings.SQLALCHEMY_DATABASE_URI)

    engine = init_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal(), engine

def run_migrations():
    """Run database migrations."""
    try:
        logger.info("Running database migrations...")
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        return False

@click.group()
def cli():
    """Database operations CLI."""
    pass

@cli.command()
@click.option('--test', is_flag=True, help='Initialize test database')
def init(test):
    """Initialize the database."""
    if test:
        database_url = "sqlite:///test.db"
        logger.info("Initializing test database...")
    else:
        database_url = str(settings.SQLALCHEMY_DATABASE_URI)
        logger.info("Initializing main database...")

    db, _ = get_db_session(database_url)
    try:
        init_db(db, is_test=test)
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        sys.exit(1)
    finally:
        db.close()

@cli.command()
def migrate():
    """Run database migrations."""
    if run_migrations():
        sys.exit(0)
    sys.exit(1)

@cli.command()
@click.argument('name')
def create_migration(name):
    """Create a new migration."""
    try:
        logger.info(f"Creating new migration: {name}")
        alembic_cfg = Config("alembic.ini")
        command.revision(alembic_cfg, autogenerate=True, message=name)
        logger.info("Migration created successfully")
    except Exception as e:
        logger.error(f"Error creating migration: {e}")
        sys.exit(1)

@cli.command()
@click.option('--fix', is_flag=True, help='Attempt to fix issues by running migrations')
def verify(fix):
    """Verify database schema."""
    db, engine = get_db_session()
    try:
        logger.info("Verifying database schema...")

        # Check if we can connect
        db.execute(text("SELECT 1"))
        logger.info("Database connection successful")

        # Get inspector
        inspector = inspect(engine)

        # Check if all tables exist
        from backend.app.db.base import Base
        missing_tables = []
        for table in Base.metadata.sorted_tables:
            try:
                if inspector.has_table(table.name):
                    result = db.execute(text(f"SELECT 1 FROM {table.name} LIMIT 1"))
                    logger.info(f"Table {table.name} verified")
                else:
                    missing_tables.append(table.name)
                    logger.warning(f"Table {table.name} is missing")
            except (ProgrammingError, OperationalError) as e:
                missing_tables.append(table.name)
                logger.warning(f"Error checking table {table.name}: {e}")
                db.rollback()

        if missing_tables:
            if fix:
                logger.info("Attempting to fix missing tables by running migrations...")
                if run_migrations():
                    logger.info("Successfully fixed database schema")
                else:
                    logger.error("Failed to fix database schema")
                    sys.exit(1)
            else:
                logger.error(f"Missing tables: {', '.join(missing_tables)}")
                logger.info("Run with --fix to attempt automatic fix")
                sys.exit(1)
        else:
            logger.info("Database schema verification completed successfully")

    except Exception as e:
        logger.error(f"Error verifying database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == '__main__':
    cli()
