"""Tests for Storyboard model."""
import pytest
from datetime import datetime, timezone
from backend.app.models import Storyboard
from tests.factories import StoryboardFactory, UniverseFactory, SceneFactory


def test_create_storyboard(session):
    """Test creating a new storyboard."""
    universe = UniverseFactory()
    storyboard = StoryboardFactory(
        name="Test Storyboard",
        description="A test storyboard description",
        universe=universe,
    )
    session.commit()

    assert storyboard.id is not None
    assert storyboard.name == "Test Storyboard"
    assert storyboard.description == "A test storyboard description"
    assert storyboard.universe == universe
    assert isinstance(storyboard.created_at, datetime)
    assert isinstance(storyboard.updated_at, datetime)


def test_storyboard_to_dict(session):
    """Test the to_dict method of Storyboard model."""
    storyboard = StoryboardFactory()
    session.commit()

    storyboard_dict = storyboard.to_dict()
    assert isinstance(storyboard_dict, dict)
    assert storyboard_dict["id"] == storyboard.id
    assert storyboard_dict["name"] == storyboard.name
    assert storyboard_dict["description"] == storyboard.description
    assert storyboard_dict["universe_id"] == storyboard.universe.id
    assert isinstance(storyboard_dict["created_at"], str)
    assert isinstance(storyboard_dict["updated_at"], str)


def test_storyboard_relationships(session):
    """Test storyboard relationships with other models."""
    storyboard = StoryboardFactory()
    scenes = [SceneFactory(storyboard=storyboard) for _ in range(3)]
    session.commit()

    # Test universe relationship
    assert storyboard.universe is not None
    assert hasattr(storyboard.universe, "id")
    assert hasattr(storyboard.universe, "name")

    # Test scenes relationship
    assert len(storyboard.scenes) == 3
    assert all(isinstance(scene, Scene) for scene in storyboard.scenes)
    assert all(scene.storyboard_id == storyboard.id for scene in storyboard.scenes)


def test_storyboard_cascade_delete(session):
    """Test that deleting a storyboard cascades to related models."""
    storyboard = StoryboardFactory()
    scenes = [SceneFactory(storyboard=storyboard) for _ in range(3)]
    session.commit()

    # Store IDs for verification
    storyboard_id = storyboard.id
    scene_ids = [scene.id for scene in scenes]

    # Delete the storyboard
    session.delete(storyboard)
    session.commit()

    # Verify storyboard is deleted
    assert Storyboard.query.get(storyboard_id) is None

    # Verify related scenes are deleted
    from backend.app.models import Scene

    for scene_id in scene_ids:
        assert Scene.query.get(scene_id) is None


def test_storyboard_validation(session):
    """Test storyboard model validation."""
    universe = UniverseFactory()

    # Test name is required
    with pytest.raises(Exception):
        storyboard = Storyboard(description="Test", universe=universe)
        session.add(storyboard)
        session.commit()

    # Test universe is required
    with pytest.raises(Exception):
        storyboard = Storyboard(name="Test", description="Test")
        session.add(storyboard)
        session.commit()


def test_storyboard_unique_name_per_universe(session):
    """Test that storyboard names must be unique per universe."""
    universe = UniverseFactory()
    storyboard1 = StoryboardFactory(name="Same Name", universe=universe)
    session.commit()

    # Try to create another storyboard with the same name in the same universe
    with pytest.raises(Exception):
        storyboard2 = StoryboardFactory(name="Same Name", universe=universe)
        session.commit()

    # Should be able to create storyboard with same name in different universe
    other_universe = UniverseFactory()
    storyboard3 = StoryboardFactory(name="Same Name", universe=other_universe)
    session.commit()  # Should not raise an exception


def test_storyboard_scene_ordering(session):
    """Test that scenes maintain proper ordering."""
    storyboard = StoryboardFactory()
    scenes = [SceneFactory(storyboard=storyboard, sequence=i) for i in range(3)]
    session.commit()

    # Verify scenes are ordered by sequence
    assert [scene.sequence for scene in storyboard.scenes] == [0, 1, 2]

    # Test reordering scenes
    scenes[0].sequence = 3
    session.commit()

    # Verify new order
    assert [scene.sequence for scene in storyboard.scenes] == [1, 2, 3]
