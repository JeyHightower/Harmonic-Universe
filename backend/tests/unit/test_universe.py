"""Unit tests for Universe model."""

import pytest
from datetime import datetime
from app.models.core.universe import Universe
from app.models.core.scene import Scene
from app.models.audio.audio_file import AudioFile
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.audio.music_parameter import MusicParameter
from tests.utils.base_test import BaseTest

class TestUniverse(BaseTest):
    """Test cases for Universe model."""

    def _setup_test_data(self):
        """Set up test data."""
        self.test_user = self.create_test_user()

    def test_create_universe(self):
        """Test Universe model creation."""
        test_data = {
            "name": "Test Universe",
            "description": "A test universe",
            "creator_id": self.test_user.id,
            "is_public": True,
            "max_participants": 10
        }

        universe = Universe(**test_data)
        self.db.add(universe)
        self.db.commit()

        # Verify fields
        self.assert_model_fields(universe, test_data)
        self.assert_timestamps(universe)

        # Verify relationships
        assert universe.creator == self.test_user
        self.assert_relationship_count(universe, "scenes", 0)
        self.assert_relationship_count(universe, "audio_files", 0)
        self.assert_relationship_count(universe, "physics_parameters_rel", 0)
        self.assert_relationship_count(universe, "music_parameters_rel", 0)

    def test_universe_relationships(self):
        """Test Universe relationships."""
        # Create universe
        universe = Universe(
            name="Test Universe",
            description="A test universe",
            creator_id=self.test_user.id
        )
        self.db.add(universe)
        self.db.commit()

        # Add scene
        scene = Scene(
            name="Test Scene",
            description="A test scene",
            universe_id=universe.id,
            creator_id=self.test_user.id
        )
        self.db.add(scene)

        # Add audio file
        audio = AudioFile(
            name="Test Audio",
            universe_id=universe.id,
            creator_id=self.test_user.id,
            file_path="/test/path.mp3"
        )
        self.db.add(audio)

        # Add physics parameter
        physics = PhysicsParameter(
            name="Gravity",
            value=9.81,
            unit="m/s²",
            universe_id=universe.id
        )
        self.db.add(physics)

        # Add music parameter
        music = MusicParameter(
            name="Tempo",
            value=120,
            unit="bpm",
            universe_id=universe.id
        )
        self.db.add(music)

        self.db.commit()

        # Verify relationships
        self.assert_relationship_count(universe, "scenes", 1)
        self.assert_relationship_count(universe, "audio_files", 1)
        self.assert_relationship_count(universe, "physics_parameters_rel", 1)
        self.assert_relationship_count(universe, "music_parameters_rel", 1)

        # Verify cascade delete
        self.db.delete(universe)
        self.db.commit()

        # Verify all related objects are deleted
        self.assert_db_state(Scene, 0, universe_id=universe.id)
        self.assert_db_state(AudioFile, 0, universe_id=universe.id)
        self.assert_db_state(PhysicsParameter, 0, universe_id=universe.id)
        self.assert_db_state(MusicParameter, 0, universe_id=universe.id)

    def test_universe_validation(self):
        """Test Universe model validation."""
        # Test required fields
        with pytest.raises(Exception):  # Adjust exception type based on your validation
            universe = Universe()
            self.db.add(universe)
            self.db.commit()

        # Test field constraints
        universe = Universe(
            name="A" * 256,  # Exceed max length
            creator_id=self.test_user.id
        )
        with pytest.raises(Exception):  # Adjust exception type based on your validation
            self.db.add(universe)
            self.db.commit()

    def test_universe_defaults(self):
        """Test Universe model defaults."""
        universe = Universe(
            name="Test Universe",
            creator_id=self.test_user.id
        )
        self.db.add(universe)
        self.db.commit()

        assert universe.is_public is True
        assert universe.max_participants == 10
        assert universe.collaborators_count == 0
        assert universe.physics_parameters == {}
        assert universe.music_parameters == {}
