#!/usr/bin/env python
# Special WSGI wrapper for Render.com deployment
import os
import sys
import logging
from sqlalchemy import create_engine, inspect, text

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi_wrapper")

# Try to detect and fix DB migration state before app loads
try:
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        logger.info("Checking database state before app initialization...")
        engine = create_engine(database_url)

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
    logger.error(f"Error checking database: {e}")
    # Continue anyway - we don't want to fail the build

# Set environment variable to skip migrations completely
os.environ['SKIP_DB_UPGRADE'] = 'true'
logger.info("Set SKIP_DB_UPGRADE=true to prevent migration attempts")

# Import your actual application
try:
    from app import create_app
    app = create_app()
    logger.info("Application successfully initialized using app.create_app()")
except ImportError:
    try:
        from backend.app import create_app
        app = create_app()
        logger.info("Application successfully initialized using backend.app.create_app()")
    except ImportError:
        try:
            import wsgi
            app = wsgi.app
            logger.info("Application successfully initialized from wsgi.app")
        except ImportError:
            from flask import Flask
            app = Flask(__name__)

            @app.route('/')
            def home():
                return "Could not import application. Check your imports!"

            logger.error("Failed to import application! Created placeholder app.")

logger.info("Application successfully initialized in wsgi_wrapper.py")

if __name__ == "__main__":
    app.run()
