"""Test database setup script."""
import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from app import create_app, db
from app.models import (
    User,
    Profile,
    Universe,
    UniverseAccess,
    Collaborator,
    Storyboard,
    Scene,
    VisualEffect,
    AudioTrack,
    PhysicsObject,
    PhysicsConstraint,
)


def setup_test_db():
    """Set up test database with initial data."""
    # Create test app instance
    app = create_app("testing")

    with app.app_context():
        # Drop all tables
        db.drop_all()

        # Create all tables
        db.create_all()

        # Create test user
        test_user = User(username="testuser", email="test@example.com", is_active=True)
        test_user.set_password("password123")
        db.session.add(test_user)

        # Create test profile
        test_profile = Profile(
            user=test_user, bio="Test bio", preferences={"theme": "dark"}
        )
        db.session.add(test_profile)

        # Create test universe
        test_universe = Universe(
            name="Test Universe",
            description="Test Description",
            user=test_user,
            is_public=True,
            max_participants=10,
        )
        db.session.add(test_universe)

        # Create test storyboard
        test_storyboard = Storyboard(
            name="Test Storyboard",
            description="Test Description",
            universe=test_universe,
        )
        db.session.add(test_storyboard)

        # Create test scene
        test_scene = Scene(
            name="Test Scene",
            description="Test Description",
            sequence=1,
            storyboard=test_storyboard,
            physics_settings={
                "gravity": {"x": 0, "y": -9.81},
                "time_step": 1 / 60,
                "velocity_iterations": 8,
                "position_iterations": 3,
                "enabled": True,
            },
        )
        db.session.add(test_scene)

        # Create test physics objects
        test_object_a = PhysicsObject(
            name="Test Object A",
            object_type="circle",
            scene=test_scene,
            position={"x": 0, "y": 0},
            dimensions={"radius": 25},
        )
        test_object_b = PhysicsObject(
            name="Test Object B",
            object_type="circle",
            scene=test_scene,
            position={"x": 100, "y": 0},
            dimensions={"radius": 25},
        )
        db.session.add_all([test_object_a, test_object_b])

        # Create test physics constraint
        test_constraint = PhysicsConstraint(
            name="Test Constraint",
            constraint_type="distance",
            scene=test_scene,
            object_a=test_object_a,
            object_b=test_object_b,
            properties={"min_length": 50, "max_length": 150},
        )
        db.session.add(test_constraint)

        # Create test media effects
        test_visual_effect = VisualEffect(
            name="Test Visual Effect",
            effect_type="fade",
            scene=test_scene,
            parameters={"duration": 1.0},
        )
        test_audio_track = AudioTrack(
            name="Test Audio Track",
            track_type="background",
            scene=test_scene,
            parameters={"volume": 0.8},
        )
        db.session.add_all([test_visual_effect, test_audio_track])

        # Commit all changes
        db.session.commit()

        print("Test database setup completed successfully.")


if __name__ == "__main__":
    setup_test_db()
