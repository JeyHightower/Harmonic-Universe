#!/usr/bin/env python
# Special WSGI wrapper for Render.com deployment
import os
import sys
import logging
import time
from sqlalchemy import create_engine, inspect, text

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi_wrapper")

# Maximum number of connection attempts
MAX_ATTEMPTS = 3

# Try to detect and fix DB migration state before app loads
try:
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        logger.info("Checking database state before app initialization...")

        # Attempt database connection with retries
        for attempt in range(MAX_ATTEMPTS):
            try:
                engine = create_engine(database_url)
                logger.info(f"Database connection successful on attempt {attempt+1}")
                break
            except Exception as e:
                if attempt < MAX_ATTEMPTS - 1:
                    logger.warning(f"Database connection failed on attempt {attempt+1}: {e}")
                    time.sleep(2)  # Wait before retry
                else:
                    logger.error(f"All database connection attempts failed: {e}")
                    raise

        # Check for existing tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"Found tables: {tables}")

        # If users exists but alembic_version doesn't, create it
        if 'users' in tables:
            # Check if alembic_version exists
            alembic_exists = 'alembic_version' in tables

            # The specific problematic migration ID from your error
            MIGRATION_ID = '60ebacf5d282'

            with engine.connect() as conn:
                if not alembic_exists:
                    logger.info("Creating alembic_version table...")
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS alembic_version (
                            version_num VARCHAR(32) NOT NULL,
                            PRIMARY KEY (version_num)
                        )
                    """))

                    # Insert the migration ID that's causing problems
                    logger.info(f"Setting migration version to {MIGRATION_ID}...")
                    conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{MIGRATION_ID}')"))
                    conn.commit()
                    logger.info("Database stamped to prevent table creation attempts")
                else:
                    # Check current version
                    result = conn.execute(text("SELECT version_num FROM alembic_version"))
                    rows = result.fetchall()

                    if rows:
                        current_version = rows[0][0]
                        logger.info(f"Current migration version: {current_version}")

                        # Update if not matching our problem migration
                        if current_version != MIGRATION_ID:
                            logger.info(f"Updating migration version to {MIGRATION_ID}...")
                            conn.execute(text("DELETE FROM alembic_version"))
                            conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{MIGRATION_ID}')"))
                            conn.commit()
                            logger.info("Migration version updated")
                    else:
                        # Table exists but is empty
                        logger.info(f"No migration version found, setting to {MIGRATION_ID}...")
                        conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{MIGRATION_ID}')"))
                        conn.commit()
                        logger.info("Migration version set")
except Exception as e:
    logger.error(f"Error in database check/fix: {e}")
    # Log but continue - we don't want to prevent app startup

# Set environment variable to skip migrations completely
os.environ['SKIP_DB_UPGRADE'] = 'true'
logger.info("Set SKIP_DB_UPGRADE=true to prevent migration attempts")

# Import your actual application
logger.info("Attempting to import application...")
app = None

# Try multiple import patterns in sequence
import_attempts = [
    lambda: __import__('app').create_app(),
    lambda: __import__('backend.app').create_app(),
    lambda: __import__('wsgi').app,
    lambda: __import__('app.main').app,
    lambda: __import__('backend.app.main').app
]

last_error = None
for import_func in import_attempts:
    try:
        app = import_func()
        logger.info(f"Successfully imported application using {import_func.__code__}")
        break
    except (ImportError, AttributeError) as e:
        last_error = e
        logger.warning(f"Import attempt failed: {e}")

# If all imports failed, create a basic app
if app is None:
    from flask import Flask, jsonify
    logger.error(f"All import attempts failed, last error: {last_error}")
    logger.info("Creating fallback application")

    app = Flask(__name__)

    @app.route('/')
    def home():
        return "Application could not be properly imported. Check your project structure and imports."

    @app.route('/api/health')
    def health():
        return jsonify({"status": "unhealthy", "message": "Application fallback mode"})

logger.info("Application initialization complete")

if __name__ == "__main__":
    app.run()
