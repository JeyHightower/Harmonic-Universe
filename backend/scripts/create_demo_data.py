import sys
import os
from pathlib import Path
import time

def setup_environment():
    """Setup the environment for both local and Docker builds"""
    # In Docker, the app directory is at /app
    if os.path.exists('/app'):
        sys.path.append('/app')
    else:
        # Local environment - use relative path
        backend_dir = Path(__file__).resolve().parent.parent
        sys.path.append(str(backend_dir))

    # Load environment variables from .env if it exists
    env_paths = ['/app/.env', Path(__file__).resolve().parent.parent / '.env']
    for env_path in env_paths:
        if os.path.exists(str(env_path)):
            from dotenv import load_dotenv
            load_dotenv(str(env_path))
            break

def wait_for_db(max_retries=5, retry_interval=5):
    """Wait for database to be ready"""
    from sqlalchemy import create_engine
    from sqlalchemy.exc import OperationalError

    db_url = os.getenv('DATABASE_URL', 'postgresql://harmonic_user:harmonic_password@db:5432/harmonic_universe')

    for attempt in range(max_retries):
        try:
            engine = create_engine(db_url)
            engine.connect()
            print("Database connection successful!")
            return True
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Database not ready. Retrying in {retry_interval} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_interval)
            else:
                print(f"Could not connect to database after {max_retries} attempts")
                raise e

from app import create_app
from app.extensions import db
from app.api.models.user import User
from app.api.models.universe import Universe

def create_demo_data():
    """Create demo user and universe in any environment"""
    try:
        setup_environment()

        # Wait for database to be ready
        wait_for_db()

        app = create_app()

        with app.app_context():
            # Check if demo user exists
            demo_user = User.query.filter_by(email='demo@example.com').first()

            if not demo_user:
                # Create demo user if doesn't exist
                demo_user = User(
                    username='demo_user',
                    email='demo@example.com'
                )
                demo_user.set_password('demo123')

                # Add and commit to database
                db.session.add(demo_user)
                db.session.commit()
                print(f"Demo user created: {demo_user.username}, {demo_user.email}")
            else:
                print(f"Using existing demo user: {demo_user.username}, {demo_user.email}")

            # Check if test universe exists
            test_universe = Universe.query.filter_by(name='Test Universe').first()

            if not test_universe:
                # Create a test universe
                test_universe = Universe(
                    name='Test Universe',
                    description='A test universe for demo user',
                    user_id=demo_user.id,
                    is_public=True
                )

                # Add and commit universe
                db.session.add(test_universe)
                db.session.commit()
                print(f"Test universe created: {test_universe.name}, owned by {test_universe.user_id}")
            else:
                print(f"Using existing test universe: {test_universe.name}, owned by {test_universe.user_id}")

    except Exception as e:
        print(f"Error: {str(e)}")
        print("Make sure your environment is properly configured and database is accessible")
        sys.exit(1)

if __name__ == '__main__':
    create_demo_data()
