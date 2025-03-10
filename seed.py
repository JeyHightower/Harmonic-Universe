from flask import Flask
from models import db, User, Universe, Scene
import os
from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from models.physics_parameter import PhysicsParameter
from models.audio_file import AudioFile
from models.midi_sequence import MidiSequence
from models.audio_track import AudioTrack
from models.visualization import Visualization
from models.ai_model import AiModel

# Create a minimal application
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///harmonic.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_database(db: Session):
    """Seed the database with initial data"""
    # Clear existing data (if needed)
    db.query(AiModel).delete()
    db.query(Visualization).delete()
    db.query(AudioTrack).delete()
    db.query(MidiSequence).delete()
    db.query(AudioFile).delete()
    db.query(PhysicsParameter).delete()
    db.query(Scene).delete()
    db.query(Universe).delete()
    db.query(User).delete()

    # Create test users
    admin_id = uuid.uuid4()
    user1_id = uuid.uuid4()
    user2_id = uuid.uuid4()

    admin = User(
        id=admin_id,
        username="admin",
        email="admin@example.com",
        password_hash=pwd_context.hash("admin123"),
        is_active=True,
        is_verified=True,
        color="#4A90E2"
    )

    user1 = User(
        id=user1_id,
        username="john_doe",
        email="john@example.com",
        password_hash=pwd_context.hash("password123"),
        is_active=True,
        is_verified=True,
        color="#F5A623"
    )

    user2 = User(
        id=user2_id,
        username="jane_smith",
        email="jane@example.com",
        password_hash=pwd_context.hash("password123"),
        is_active=True,
        is_verified=True,
        color="#7ED321"
    )

    db.add_all([admin, user1, user2])
    db.flush()

    # Create universes
    universe1_id = uuid.uuid4()
    universe2_id = uuid.uuid4()
    universe3_id = uuid.uuid4()

    universe1 = Universe(
        id=universe1_id,
        name="Harmonic Galaxy",
        description="A universe where sound waves create physical structures.",
        is_public=True,
        user_id=user1_id,
        physics_params={
            "gravity": 9.8,
            "speed_of_sound": 343.0,
            "wavelength_scale": 0.5
        },
        harmony_params={
            "base_frequency": 440,
            "scale": "chromatic",
            "octave_range": 4
        }
    )

    universe2 = Universe(
        id=universe2_id,
        name="Resonance Field",
        description="Sound frequencies manifest as visible energy fields.",
        is_public=False,
        user_id=user1_id,
        physics_params={
            "gravity": 5.2,
            "resonance_factor": 2.7,
            "energy_dissipation": 0.3
        }
    )

    universe3 = Universe(
        id=universe3_id,
        name="Rhythmic Cosmos",
        description="A universe governed by ever-changing rhythmic patterns.",
        is_public=True,
        user_id=user2_id,
        physics_params={
            "time_dilation": 1.2,
            "rhythm_factor": 4.0,
            "entropy_rate": 0.1
        }
    )

    db.add_all([universe1, universe2, universe3])
    db.flush()

    # Create scenes
    scene1_id = uuid.uuid4()
    scene2_id = uuid.uuid4()
    scene3_id = uuid.uuid4()
    scene4_id = uuid.uuid4()

    scene1 = Scene(
        id=scene1_id,
        name="Crystal Caves",
        description="Sound waves create crystalline formations in deep caves.",
        order=1,
        universe_id=universe1_id,
        creator_id=user1_id,
        physics_overrides={
            "echo_factor": 3.0,
            "crystal_growth_rate": 0.8
        }
    )

    scene2 = Scene(
        id=scene2_id,
        name="Resonant Plains",
        description="Wide open spaces where the ground vibrates with deep bass.",
        order=2,
        universe_id=universe1_id,
        creator_id=user1_id
    )

    scene3 = Scene(
        id=scene3_id,
        name="Energy Nexus",
        description="A central node where all energy frequencies converge.",
        order=1,
        universe_id=universe2_id,
        creator_id=user1_id
    )

    scene4 = Scene(
        id=scene4_id,
        name="Temporal Rhythm Chamber",
        description="Time flows differently based on the rhythm being played.",
        order=1,
        universe_id=universe3_id,
        creator_id=user2_id,
        physics_overrides={
            "time_scale": 0.75,
            "rhythm_intensity": 2.5
        }
    )

    db.add_all([scene1, scene2, scene3, scene4])
    db.flush()

    # Create physics parameters
    param1 = PhysicsParameter(
        name="Crystal Resonance",
        value=440.0,
        unit="Hz",
        min_value=220.0,
        max_value=880.0,
        universe_id=universe1_id
    )

    param2 = PhysicsParameter(
        name="Sound Velocity",
        value=343.0,
        unit="m/s",
        min_value=300.0,
        max_value=400.0,
        universe_id=universe1_id
    )

    param3 = PhysicsParameter(
        name="Energy Field Strength",
        value=5.7,
        unit="EFU",
        min_value=0.0,
        max_value=10.0,
        universe_id=universe2_id
    )

    db.add_all([param1, param2, param3])
    db.flush()

    # Create audio tracks
    track1 = AudioTrack(
        name="Crystal Formation",
        type="ambient",
        parameters={
            "frequency": 440,
            "modulation": "sine",
            "decay": 2.5
        },
        universe_id=universe1_id
    )

    track2 = AudioTrack(
        name="Resonant Field",
        type="resonance",
        parameters={
            "base_frequency": 110,
            "harmonics": [1, 3, 5, 7],
            "intensity": 0.8
        },
        universe_id=universe2_id
    )

    db.add_all([track1, track2])
    db.flush()

    # Create visualizations
    viz1 = Visualization(
        name="Crystal Wave Visualization",
        type="waveform",
        parameters={
            "color_scale": "blue-purple",
            "amplitude_scale": 2.0,
            "resolution": "high"
        },
        user_id=user1_id,
        universe_id=universe1_id
    )

    viz2 = Visualization(
        name="Energy Field Map",
        type="heatmap",
        parameters={
            "color_scale": "viridis",
            "intensity_mapping": "logarithmic",
            "grid_size": 256
        },
        user_id=user1_id,
        universe_id=universe2_id
    )

    db.add_all([viz1, viz2])
    db.flush()

    # Create AI models
    ai_model1 = AiModel(
        name="Crystal Growth Predictor",
        type="regression",
        parameters={
            "algorithm": "neural_network",
            "layers": [10, 20, 10],
            "training_parameters": {
                "epochs": 100,
                "learning_rate": 0.001
            }
        },
        user_id=user1_id
    )

    ai_model2 = AiModel(
        name="Rhythm Classifier",
        type="classification",
        parameters={
            "algorithm": "random_forest",
            "n_estimators": 100,
            "max_depth": 10
        },
        user_id=user2_id
    )

    db.add_all([ai_model1, ai_model2])

    # Commit all changes
    db.commit()

    print("Database seeded successfully!")

if __name__ == '__main__':
    with app.app_context():
        seed_database(db.session)
