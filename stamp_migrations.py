#!/usr/bin/env python
"""
Stamp Migrations Script

This script fixes the "Table Already Exists" error by stamping the database
with the current head revision. Use this when you have tables in your database
but Alembic doesn't know about them.
"""
import os
import sys
import logging
from sqlalchemy import inspect

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("migration_stamp")

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def fix_migrations():
    """Fix migration state by stamping the database with current head revision"""
    logger.info("Starting migration fix")

    try:
        # Try to import Flask and Flask-Migrate
        try:
            from flask import Flask
            from flask_migrate import Migrate, stamp
        except ImportError as e:
            logger.error(f"Required package not found: {e}")
            logger.error("Please install required packages: pip install flask flask-sqlalchemy flask-migrate")
            return False

        # Try to import app and db from your application
        try:
            # First try standard import
            try:
                from app import create_app, db
                app = create_app()
                logger.info("Application imported successfully")
            except (ImportError, AttributeError):
                # If that fails, try backend.app
                try:
                    from backend.app import create_app, db
                    app = create_app()
                    logger.info("Application imported from backend.app")
                except (ImportError, AttributeError):
                    # If that also fails, try direct app import
                    try:
                        from app import app, db
                        logger.info("App instance imported directly")
                    except (ImportError, AttributeError) as e:
                        logger.error(f"Could not import application: {e}")
                        logger.error("Make sure your application structure is correct")
                        return False

            with app.app_context():
                # Check if tables exist but alembic_version doesn't
                inspector = inspect(db.engine)
                tables = inspector.get_table_names()

                logger.info(f"Existing tables: {tables}")

                if 'users' in tables and 'alembic_version' not in tables:
                    logger.info("Database has tables but no migration tracking")

                    # Initialize migration
                    migrate = Migrate(app, db)

                    # Stamp the database with current migration head
                    # This tells Alembic that all current models are up to date
                    logger.info("Stamping database with current head revision...")
                    stamp()

                    logger.info("Migration state fixed - database stamped with current head")
                    return True
                elif 'alembic_version' in tables:
                    logger.info("Alembic version table already exists - checking it's up to date")

                    # Initialize migration
                    migrate = Migrate(app, db)

                    # Still stamp to ensure it's at the current head
                    logger.info("Updating to current head revision...")
                    stamp()

                    logger.info("Migration state updated to current head")
                    return True
                else:
                    logger.info("Database appears to be empty or no users table found")
                    logger.info("No migration fix needed - you may need to run flask db upgrade")
                    return False

        except Exception as e:
            logger.error(f"Error during migration stamping: {e}")
            return False

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = fix_migrations()
    if success:
        print("\n✅ Migration state fixed successfully!")
        print("Your database has been stamped with the current migration version.")
        print("You should now be able to run migrations normally without the 'table already exists' error.")
        print("\nNext steps:")
        print("  1. Try running flask db migrate to create a new migration")
        print("  2. Run flask db upgrade to apply any new changes")
        sys.exit(0)
    else:
        print("\n❌ Migration fix was not applied")
        print("Please check the logs above for details on why the fix failed.")
        print("\nYou can try these alternative approaches:")
        print("  1. Run 'flask db stamp head' directly")
        print("  2. Use the more comprehensive fix_migrations.py script")
        print("  3. Check your database connection and Flask application structure")
        sys.exit(1)
