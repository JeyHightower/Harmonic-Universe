"""Demo user creation."""
from app.db.session import get_db
from app.models.core.user import User
from app.models.core.universe import Universe
from app.models.core.scene import Scene

def create_demo_user():
    """Create demo user if it doesn't exist."""
    with get_db() as db:
        demo_user = db.query(User).filter_by(email='demo@example.com').first()

        if not demo_user:
            demo_user = User(
                username='Demo',
                email='demo@example.com',
                password='password',
                is_active=True,
                color='#FF0000'
            )
            demo_user.save(db)

            # Create a sample universe for the demo user
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
            demo_universe.save(db)

            # Create a sample scene
            demo_scene = Scene(
                name='Welcome Scene',
                description='Welcome to Harmonic Universe',
                universe_id=demo_universe.id,
                creator_id=demo_user.id
            )
            demo_scene.save(db)

        return demo_user
