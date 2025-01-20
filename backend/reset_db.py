"""Script to reset the database and migrations."""
import os
import sys
from flask import Flask
from flask_migrate import Migrate
from app import create_app
from app.extensions import db
from app.models import User, Universe, PhysicsParameters, MusicParameters, VisualizationParameters

def reset_database():
    """Reset the database by dropping all tables and recreating them."""
    try:
        # Create Flask app
        app = create_app()

        # Drop all tables
        with app.app_context():
            db.drop_all()
            db.create_all()
            print("Database tables dropped and recreated successfully.")

        # Remove migration files
        migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations', 'versions')
        if os.path.exists(migrations_dir):
            for f in os.listdir(migrations_dir):
                if f.endswith('.py') and f != '__init__.py':
                    os.remove(os.path.join(migrations_dir, f))
            print("Migration files removed successfully.")

        # Initialize new migration
        with app.app_context():
            migrate = Migrate(app, db)
            os.system('flask db stamp head')
            os.system('flask db migrate -m "Initial migration"')
            os.system('flask db upgrade')
            print("New migration initialized successfully.")

        return True
    except Exception as e:
        print(f"Error resetting database: {str(e)}")
        return False

if __name__ == '__main__':
    success = reset_database()
    sys.exit(0 if success else 1)
