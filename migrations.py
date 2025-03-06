import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from flask import Flask
# Commented out Flask-Migrate import as it's causing issues
# from flask_migrate import Migrate, MigrateCommand, init, migrate, upgrade
from models import db, User, Universe, Scene
from werkzeug.security import generate_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('migrations')

def run_migrations(app):
    """Run database migrations and create initial data if needed"""
    with app.app_context():
        try:
            logger.info("Setting up database...")
            # Create all tables directly instead of using migrations
            db.create_all()
            logger.info("Database tables created")

            # Create initial data
            create_initial_data(app)
            logger.info("Migrations and initial data setup complete")
        except SQLAlchemyError as e:
            logger.error(f"Database error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise

def create_initial_data(app):
    """Create initial data in the database if it doesn't exist"""
    with app.app_context():
        try:
            # Check if there are existing users
            if User.query.count() == 0:
                logger.info("Creating demo user...")
                # Create demo user
                demo_user = User(
                    username="demo",
                    email="demo@example.com",
                    password_hash=generate_password_hash("password")
                )
                db.session.add(demo_user)
                db.session.commit()
                logger.info("Demo user created successfully")

            # Check if there are existing universes
            if Universe.query.count() == 0:
                logger.info("Creating sample universe...")
                # Create a sample universe
                sample_universe = Universe(
                    name="Sample Universe",
                    description="A sample universe for demonstration",
                    user_id=1,
                    public=True
                )
                db.session.add(sample_universe)
                db.session.commit()
                logger.info("Sample universe created successfully")

            # Check if there are existing scenes
            if Scene.query.count() == 0:
                logger.info("Creating sample scene...")
                # Create a sample scene
                sample_scene = Scene(
                    title="Sample Scene",
                    content="This is a sample scene for demonstration purposes.",
                    universe_id=1,
                    position=1
                )
                db.session.add(sample_scene)
                db.session.commit()
                logger.info("Sample scene created successfully")

            logger.info("Initial data setup complete")
        except SQLAlchemyError as e:
            logger.error(f"Error creating initial data: {e}")
            db.session.rollback()
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating initial data: {e}")
            db.session.rollback()
            raise

# Helper function to check DB connection
def check_db_connection(app):
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            logger.info("Database connection successful")
            return True
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return False

# This function can be called to update the database schema if needed
def update_schema(app):
    with app.app_context():
        try:
            logger.info("Updating database schema...")
            # This is a simplified approach - in production you'd want more careful migrations
            db.create_all()
            logger.info("Database schema updated")
        except Exception as e:
            logger.error(f"Error updating schema: {e}")
            raise

if __name__ == "__main__":
    if run_migrations():
        sys.exit(0)
    else:
        sys.exit(1)
