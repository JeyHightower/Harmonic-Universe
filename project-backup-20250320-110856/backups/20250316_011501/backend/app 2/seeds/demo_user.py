"""Demo user creation and management."""
from app.db.session import get_db
from app.models.user import User
from app.models.universe import Universe
from app.models.universe.scene import Scene
from sqlalchemy.exc import IntegrityError
import logging

logger = logging.getLogger(__name__)

def create_demo_user():
    """Create demo user if it doesn't exist."""
    with get_db() as db:
        try:
            # Check if demo user exists
            demo_user = db.query(User).filter_by(email='demo@example.com').first()

            if not demo_user:
                # Create demo user
                demo_user = User(
                    username='demo_user',
                    email='demo@example.com',
                    is_active=True,
                    color='#FF0000'
                )
                demo_user.set_password('demo123')  # Set a known password for demo user
                db.add(demo_user)
                db.flush()  # Get the user ID

                # Create a sample universe
                demo_universe = Universe(
                    name='Demo Universe',
                    description='A sample universe to explore the features',
                    is_public=True,
                    user_id=demo_user.id,
                    physics_params={
                        'gravity': 9.81,
                        'air_resistance': 0.1,
                        'elasticity': 0.8,
                        'friction': 0.3
                    },
                    harmony_params={
                        'resonance': 0.7,
                        'dissonance': 0.3,
                        'harmony_scale': 1.0,
                        'balance': 0.5
                    }
                )
                db.add(demo_universe)
                db.flush()  # Get the universe ID

                # Create a sample scene
                demo_scene = Scene(
                    name='Welcome Scene',
                    description='Welcome to Harmonic Universe',
                    universe_id=demo_universe.id,
                    creator_id=demo_user.id
                )
                db.add(demo_scene)
                db.commit()
                logger.info("Created demo user with universe and scene")
            else:
                logger.info("Demo user already exists")

            return demo_user

        except IntegrityError:
            db.rollback()
            logger.error("Integrity error creating demo user")
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating demo user: {str(e)}")
            raise

def verify_demo_user():
    """Verify demo user exists and has required data."""
    with get_db() as db:
        try:
            demo_user = db.query(User).filter_by(email='demo@example.com').first()
            if not demo_user:
                logger.warning("Demo user not found")
                return False

            demo_universe = db.query(Universe).filter_by(user_id=demo_user.id).first()
            if not demo_universe:
                logger.warning("Demo universe not found")
                return False

            demo_scene = db.query(Scene).filter_by(universe_id=demo_universe.id).first()
            if not demo_scene:
                logger.warning("Demo scene not found")
                return False

            logger.info("Verified demo user, universe, and scene exist")
            return True

        except Exception as e:
            logger.error(f"Error verifying demo user: {str(e)}")
            return False

def get_demo_user():
    """Get demo user details."""
    with get_db() as db:
        try:
            demo_user = db.query(User).filter_by(email='demo@example.com').first()
            if demo_user:
                demo_universe = db.query(Universe).filter_by(user_id=demo_user.id).first()
                demo_scene = None
                if demo_universe:
                    demo_scene = db.query(Scene).filter_by(universe_id=demo_universe.id).first()

                return {
                    'user': demo_user,
                    'universe': demo_universe,
                    'scene': demo_scene
                }
            return None

        except Exception as e:
            logger.error(f"Error getting demo user: {str(e)}")
            return None
