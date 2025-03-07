#!/usr/bin/env python
"""
Render-safe application startup
This file safely initializes the Flask application for Render deployment
by fixing the database migration state before importing the app.
"""

import os
import sys
import logging
from sqlalchemy import create_engine, inspect, text

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("render_app")

def fix_database_migrations():
    """Fix alembic migration state if needed"""
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            return False

        logger.info("Checking database migration state...")

        engine = create_engine(database_url)
        with engine.connect() as conn:
            inspector = inspect(engine)
            tables = inspector.get_table_names()

            if 'users' in tables and 'alembic_version' not in tables:
                logger.info("Creating alembic_version table and marking migrations as applied")

                # Find the latest migration revision
                migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                            "migrations", "versions")

                # Default to initial migration if we can't find the latest
                latest_revision = "60ebacf5d282"  # Your initial migration from the logs

                if os.path.exists(migrations_dir):
                    migration_files = [f for f in os.listdir(migrations_dir) if f.endswith('.py')]
                    if migration_files:
                        revisions = sorted([f.split('_')[0] for f in migration_files])
                        latest_revision = revisions[-1]

                # Create alembic_version table and mark the migration as applied
                conn.execute(text("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) PRIMARY KEY)"))
                conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{latest_revision}')"))
                conn.commit()
                logger.info(f"Database migration state fixed, marked at revision: {latest_revision}")
                return True
            elif 'alembic_version' in tables:
                logger.info("Database migration state is already tracked")
                return True
            else:
                logger.info("No existing tables found - assuming fresh database")
                return False

    except Exception as e:
        logger.error(f"Error fixing database migration state: {str(e)}")
        return False

# Try various import patterns to find the app
def get_app():
    # First fix the database if needed
    fix_database_migrations()

    # Try different import patterns
    try:
        # Try direct import from backend
        logger.info("Trying to import app from backend module...")
        from backend.app import create_app
        logger.info("Found create_app in backend.app")
        return create_app()
    except ImportError:
        try:
            # Try import from app module
            logger.info("Trying to import app from app module...")
            from app import create_app
            logger.info("Found create_app in app")
            return create_app()
        except ImportError:
            try:
                # Try import from app directly
                logger.info("Trying to import app directly...")
                from app import app
                logger.info("Found app in app module")
                return app
            except ImportError:
                try:
                    # Try import from backend/app directly
                    if os.path.exists('backend'):
                        logger.info("Trying import from backend directory...")
                        sys.path.insert(0, 'backend')
                        from app import create_app
                        logger.info("Found create_app in backend/app.py")
                        return create_app()
                except ImportError:
                    # If all else fails, create a simple app for diagnostics
                    logger.error("Could not import app through normal means")
                    from flask import Flask, jsonify

                    diagnostic_app = Flask(__name__)

                    @diagnostic_app.route('/')
                    def home():
                        return "Deployment Error: Could not import application"

                    @diagnostic_app.route('/api/health')
                    def health():
                        return jsonify({
                            "status": "error",
                            "error": "Could not import application",
                            "python_path": sys.path,
                            "cwd": os.getcwd(),
                            "files": os.listdir('.')
                        })

                    logger.warning("Created diagnostic app")
                    return diagnostic_app

# This is what Gunicorn will import
app = get_app()

if __name__ == "__main__":
    app.run()
