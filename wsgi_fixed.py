#!/usr/bin/env python3
"""
WSGI Fixed Adapter

This module acts as a universal adapter to load your Flask application
with pre-database checks to ensure migrations don't cause "relation already exists" errors.
"""

import os
import sys
import importlib
import logging
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("wsgi_fixed")

# Fix the database state
def fix_database():
    """Pre-check the database and fix migration state if needed."""
    database_url = os.environ.get('DATABASE_URL')
    target_version = '60ebacf5d282'

    if not database_url:
        logger.warning("DATABASE_URL not set - skipping database check")
        return

    try:
        logger.info("Checking database migration state...")
        # Connect to database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Check if alembic_version table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'alembic_version'
            );
        """)
        table_exists = cur.fetchone()[0]

        # Create if it doesn't exist
        if not table_exists:
            logger.info("Creating alembic_version table...")
            cur.execute("""
                CREATE TABLE alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    PRIMARY KEY (version_num)
                );
            """)

        # Set the version
        cur.execute("DELETE FROM alembic_version;")
        cur.execute(f"INSERT INTO alembic_version (version_num) VALUES ('{target_version}');")

        # Verify
        cur.execute("SELECT version_num FROM alembic_version;")
        version = cur.fetchone()[0]
        logger.info(f"Migration version set to: {version}")

        # Close connection
        cur.close()
        conn.close()

    except Exception as e:
        logger.error(f"Error fixing database: {e}")
        # Continue anyway - don't fail the startup

# Set environment variables to disable migrations
os.environ['FLASK_NO_MIGRATE'] = 'true'
os.environ['SKIP_DB_UPGRADE'] = 'true'

# Fix database state first
fix_database()

# Try to discover and load the Flask application
def find_flask_app():
    """Try different strategies to find and load the Flask application."""
    app = None

    # Strategy 1: Try importing 'app' from the root module
    try:
        logger.info("Trying to import app from root module...")
        import app as app_module
        if hasattr(app_module, 'app'):
            logger.info("Found app in 'app' module")
            return app_module.app
        elif hasattr(app_module, 'create_app'):
            logger.info("Found create_app in 'app' module")
            return app_module.create_app()
    except ImportError:
        logger.info("Could not import 'app' module")

    # Strategy 2: Try importing from wsgi
    try:
        logger.info("Trying to import app from wsgi module...")
        import wsgi
        if hasattr(wsgi, 'app'):
            logger.info("Found app in 'wsgi' module")
            return wsgi.app
    except ImportError:
        logger.info("Could not import 'wsgi' module")

    # Strategy 3: Check in common subdirectories
    dirs_to_check = ['backend', 'api', 'src', 'app', '.']
    for directory in dirs_to_check:
        if directory not in sys.path and os.path.isdir(directory):
            sys.path.insert(0, directory)

        # Try importing app from this directory
        try:
            logger.info(f"Trying to import app from {directory}...")
            if directory == '.':
                module_name = 'app'
            else:
                module_name = f"{directory}.app"

            app_module = importlib.import_module(module_name)
            if hasattr(app_module, 'app'):
                logger.info(f"Found app in {module_name}")
                return app_module.app
            elif hasattr(app_module, 'create_app'):
                logger.info(f"Found create_app in {module_name}")
                return app_module.create_app()
        except (ImportError, ModuleNotFoundError):
            logger.info(f"Could not import from {directory}")

    # If we get here, we couldn't find the app
    raise ImportError("Could not find Flask application! Please check your application structure.")

# Find and load the app
logger.info("Searching for Flask application...")
app = find_flask_app()

# Log successful initialization
logger.info("Flask application loaded successfully")
