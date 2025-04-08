#!/usr/bin/env python3
"""
Database Initialization and Migration Script for Render Deployment

This script automates the process of creating and initializing the database
for deployment on Render.com. It handles:
1. Creating database tables if they don't exist
2. Running database migrations
3. Creating a test user if needed

Usage: python init_migrations.py

Environment variables:
- DATABASE_URL: The database connection string
- FLASK_APP: The Flask application module
"""

import os
import sys
import subprocess
import time
import logging
from logging.handlers import RotatingFileHandler

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(
            'db_init.log',
            maxBytes=1024 * 1024,  # 1MB
            backupCount=3
        )
    ]
)

logger = logging.getLogger('db_init')

def run_command(command, env=None):
    """Run a shell command and return its output and exit code."""
    logger.info(f"Running command: {command}")
    try:
        env_dict = os.environ.copy()
        if env:
            env_dict.update(env)
        
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env_dict
        )
        stdout, stderr = process.communicate()
        exit_code = process.returncode
        
        if stdout:
            logger.info(f"Command output: {stdout.decode('utf-8')}")
        if stderr:
            logger.warning(f"Command error output: {stderr.decode('utf-8')}")
        
        return stdout.decode('utf-8'), stderr.decode('utf-8'), exit_code
    except Exception as e:
        logger.error(f"Error running command: {e}")
        return "", str(e), 1

def wait_for_database(max_retries=30, delay=2):
    """Wait for the database to be available."""
    logger.info("Waiting for database to be available...")
    
    # Add the backend directory to the Python path
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
    if os.path.exists(backend_dir):
        sys.path.insert(0, backend_dir)
    
    # Import after path setup
    try:
        from backend.app.extensions import db
        from backend.app import create_app
    except ImportError:
        try:
            # Try alternate import path
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from app.extensions import db
            from app import create_app
        except ImportError as e:
            logger.error(f"Could not import Flask app: {e}")
            logger.error("Current sys.path: %s", sys.path)
            logger.error("Current directory: %s", os.getcwd())
            return False
    
    retries = 0
    app = create_app()
    
    while retries < max_retries:
        try:
            with app.app_context():
                # Test database connection
                with db.engine.connect() as conn:
                    result = conn.execute(db.text('SELECT 1'))
                    logger.info("Database connection successful!")
                    return True
        except Exception as e:
            retries += 1
            logger.warning(f"Database not yet available (attempt {retries}/{max_retries}): {e}")
            time.sleep(delay)
    
    logger.error(f"Database not available after {max_retries} attempts")
    return False

def setup_database():
    """Set up the database with tables and initial migrations."""
    logger.info("Setting up database...")
    
    # Check for Flask app environment variable
    if not os.environ.get('FLASK_APP'):
        os.environ['FLASK_APP'] = 'wsgi.py'
        logger.info("FLASK_APP environment variable set to wsgi.py")
    
    # Wait for database to be available
    if not wait_for_database():
        logger.error("Failed to connect to database, exiting.")
        return False
    
    # Initialize migrations if they don't exist
    migrations_dir = os.path.join('backend', 'migrations')
    if not os.path.exists(migrations_dir):
        logger.info("Initializing migrations...")
        output, error, code = run_command("cd backend && flask db init")
        if code != 0:
            logger.error(f"Failed to initialize migrations: {error}")
            return False
    
    # Create the first migration if none exists
    migration_versions_dir = os.path.join(migrations_dir, 'versions')
    if not os.path.exists(migration_versions_dir) or not os.listdir(migration_versions_dir):
        logger.info("Creating initial migration...")
        output, error, code = run_command("cd backend && flask db migrate -m 'Initial migration'")
        if code != 0:
            logger.error(f"Failed to create initial migration: {error}")
            return False
    
    # Apply migrations
    logger.info("Applying migrations...")
    output, error, code = run_command("cd backend && flask db upgrade")
    if code != 0:
        logger.error(f"Failed to apply migrations: {error}")
        return False
    
    logger.info("Database setup completed successfully")
    return True

def create_test_user():
    """Create a test user if it doesn't exist."""
    logger.info("Checking for test user...")
    
    try:
        # Add the backend directory to the Python path
        backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
        if os.path.exists(backend_dir):
            sys.path.insert(0, backend_dir)
        
        # Try to import the model classes
        try:
            from backend.app.api.models.user import User
            from backend.app.extensions import db
            from backend.app import create_app
        except ImportError:
            # Try alternate import path
            from app.api.models.user import User
            from app.extensions import db
            from app import create_app
        
        app = create_app()
        with app.app_context():
            # Check if test user exists
            admin_user = User.query.filter_by(email="admin@example.com").first()
            if admin_user:
                logger.info("Test user already exists")
                return True
            
            # Create test user
            logger.info("Creating test user...")
            admin_user = User(
                username="admin",
                email="admin@example.com",
                first_name="Admin",
                last_name="User"
            )
            admin_user.set_password("AdminPassword123!")
            db.session.add(admin_user)
            db.session.commit()
            logger.info("Test user created successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating test user: {e}")
        return False

def main():
    """Main entry point for database initialization."""
    logger.info("Starting database initialization and migration...")
    
    # Set up the database
    if not setup_database():
        logger.error("Database setup failed")
        sys.exit(1)
    
    # Create test user
    if not create_test_user():
        logger.warning("Failed to create test user, but continuing with setup")
    
    logger.info("Database initialization and migration completed successfully")

if __name__ == "__main__":
    main() 