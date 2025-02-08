from app.models import User, Universe, Audio, Visualization
from app.extensions import db
from werkzeug.security import generate_password_hash

def create_demo_user():
    """Create a demo user with sample data"""
    # Check if demo user already exists
    if User.query.filter_by(email='demo@harmonic-universe.com').first():
        return

    # Create demo user
    demo_user = User(
        username='Demo User',
        email='demo@harmonic-universe.com',
        password_hash=generate_password_hash('demo123'),
        role='user',
        preferences={
            'theme': 'dark',
            'notifications': True,
            'autoSave': True,
            'defaultProjectSettings': {
                'isPublic': True,
                'autosaveInterval': 300
            }
        }
    )
    db.session.add(demo_user)
    db.session.commit()

    # Create sample universe
    sample_universe = Universe(
        name='Demo Universe',
        description='A sample universe to showcase features',
        user_id=demo_user.id,
        settings={
            'physics': {
                'gravity': 9.81,
                'dimensions': 3,
                'timeScale': 1.0
            },
            'harmony': {
                'baseFrequency': 440,
                'scale': 'chromatic',
                'octaves': 4
            }
        }
    )
    db.session.add(sample_universe)

    # Create sample audio
    sample_audio = Audio(
        name='Demo Track',
        description='A sample audio track',
        user_id=demo_user.id,
        universe_id=sample_universe.id,
        settings={
            'volume': 0.8,
            'pan': 0,
            'effects': []
        }
    )
    db.session.add(sample_audio)

    # Create sample visualization
    sample_viz = Visualization(
        name='Demo Visualization',
        description='A sample visualization',
        user_id=demo_user.id,
        universe_id=sample_universe.id,
        type='spectrum',
        settings={
            'colorScheme': 'rainbow',
            'sensitivity': 0.75,
            'smoothing': 0.5
        }
    )
    db.session.add(sample_viz)

    db.session.commit()
