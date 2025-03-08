#!/usr/bin/env python
"""
Script to verify database migrations are properly set up
"""
import os
import sys
import importlib.util

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    # Try to import Flask-Migrate
    from flask_migrate import Migrate, current
    print("Successfully imported Flask-Migrate")

    # Try to import the app
    from app import create_app
    app = create_app()

    # Check if alembic_version table exists
    with app.app_context():
        # Try to get current migration version
        try:
            version = current()
            if version:
                print(f"Current migration version: {version}")
            else:
                print("No migration version found. Database may not be initialized.")
                print("Run 'flask db stamp head' to initialize without applying migrations.")
                print("Or run 'flask db upgrade' to apply all migrations.")
        except Exception as e:
            print(f"Error checking migration version: {e}")
            print("Database migrations may not be properly set up.")
            print("Try running 'flask db init' if this is a new project.")
            sys.exit(1)

except ImportError as e:
    print(f"Import error: {e}")
    print("Flask-Migrate may not be installed.")
    print("Install it with: pip install Flask-Migrate")
    sys.exit(1)

print("Migration verification complete.")
