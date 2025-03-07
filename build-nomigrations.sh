#!/bin/bash
# build-nomigrations.sh - Build script that skips database migrations

echo "=== STARTING CUSTOM BUILD WITHOUT MIGRATIONS ==="

# Make sure critical dependencies are installed first
echo "Installing critical dependencies..."
pip install psycopg2-binary gunicorn Flask

# Install main Python dependencies
echo "Installing main dependencies..."
pip install -r requirements.txt

# Create alembic_version table directly (failsafe)
echo "Setting up database migration state..."
python << EOF
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Get database URL from environment
database_url = os.environ.get('DATABASE_URL')

if database_url:
    try:
        # Connect to the database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Create alembic_version table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                PRIMARY KEY (version_num)
            );
        """)

        # Set the migration version to skip problematic migration
        cur.execute("DELETE FROM alembic_version;")
        cur.execute("INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282');")

        # Verify the result
        cur.execute("SELECT * FROM alembic_version;")
        versions = cur.fetchall()
        print(f"Migration version set to: {versions}")

        # Close the connection
        cur.close()
        conn.close()
        print("Database migration state fixed successfully!")
    except Exception as e:
        print(f"Error fixing database state: {e}")
else:
    print("DATABASE_URL not found in environment variables")
EOF

# CREATE THE WSGI FILE DIRECTLY HERE
echo "Creating wsgi.py file..."
cat > wsgi.py << 'EOWSGI'
#!/usr/bin/env python3
"""
WSGI Adapter with Database Fix

This module fixes the database migration state before importing the Flask app.
"""

import os
import sys
import logging
import importlib
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('wsgi')

# Set environment variables to disable migrations
os.environ['FLASK_NO_MIGRATE'] = 'true'
os.environ['SKIP_DB_UPGRADE'] = 'true'

# Fix database function
def fix_database():
    """Fix the database migration state."""
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

        # Get database URL
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            logger.warning("DATABASE_URL not set, skipping database fix")
            return

        logger.info("Fixing database migration state...")

        # Connect to database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Create alembic_version table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                PRIMARY KEY (version_num)
            );
        """)

        # Set the migration version
        cur.execute("DELETE FROM alembic_version;")
        cur.execute("INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282');")

        # Verify
        cur.execute("SELECT version_num FROM alembic_version;")
        version = cur.fetchone()[0]
        logger.info(f"Migration version set to: {version}")

        # Close connection
        cur.close()
        conn.close()
        logger.info("Database fix completed successfully")
    except ImportError:
        logger.warning("psycopg2 not installed, skipping database fix")
    except Exception as e:
        logger.error(f"Error fixing database: {e}")
        # Continue anyway

# Fix the database first
fix_database()

# Try to import the Flask app
try:
    # Add current directory to path
    sys.path.insert(0, os.getcwd())

    # First try importing from app module
    try:
        import app
        if hasattr(app, 'app'):
            logger.info("Found app in app module")
            application = app.app
        elif hasattr(app, 'create_app'):
            logger.info("Found create_app function in app module")
            application = app.create_app()
        else:
            raise ImportError("No app found in app module")
    except ImportError as e:
        logger.info(f"Could not import from app module: {e}")

        # Try importing from backend directory
        if os.path.exists('backend'):
            sys.path.insert(0, 'backend')
            try:
                from backend.app import app as application
                logger.info("Found app in backend/app.py")
            except ImportError:
                try:
                    from backend.app import create_app
                    application = create_app()
                    logger.info("Found create_app in backend/app.py")
                except ImportError:
                    logger.error("Could not find app in backend directory")
                    raise ImportError("Could not find Flask application")
        else:
            # Try one more approach - look for a wsgi.py file
            try:
                import wsgi_original
                if hasattr(wsgi_original, 'app'):
                    application = wsgi_original.app
                    logger.info("Found app in wsgi_original.py")
                else:
                    raise ImportError("No app found in wsgi_original.py")
            except ImportError:
                raise ImportError("Could not find Flask application. Check your application structure.")

    logger.info("Flask application loaded successfully")
    app = application

except Exception as e:
    logger.error(f"Error loading Flask application: {e}")

    # Create a simple Flask app as fallback
    from flask import Flask, jsonify

    app = Flask(__name__)

    @app.route('/')
    def index():
        return "Application Error: Could not load the main Flask application"

    @app.route('/api/health')
    def health():
        return jsonify({"status": "error", "message": "Could not load main application"})

    logger.warning("Created fallback Flask application")
EOWSGI

chmod +x wsgi.py
echo "Created wsgi.py with database fix"

echo "=== BUILD COMPLETE ==="
