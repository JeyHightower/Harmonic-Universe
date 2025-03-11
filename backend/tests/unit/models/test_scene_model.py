"""Tests for Scene model."""
import pytest
from datetime import datetime, timezone
from backend.app.models import Scene
from tests.factories import (
    SceneFactory,
    StoryboardFactory,
    VisualEffectFactory,
    AudioTrackFactory,
)


def test_create_scene(session):
    """Test creating a new scene."""
    storyboard = StoryboardFactory()
    scene = SceneFactory(
        name="Test Scene",
        description="A test scene description",
        sequence=1,
        content={"layout": "grid", "elements": []},
        storyboard=storyboard,
    )
    session.commit()

    assert scene.id is not None
    assert scene.name == "Test Scene"
    assert scene.description == "A test scene description"
    assert scene.sequence == 1
    assert scene.content == {"layout": "grid", "elements": []}
    assert scene.storyboard == storyboard
    assert isinstance(scene.created_at, datetime)
    assert isinstance(scene.updated_at, datetime)


def test_scene_to_dict(session):
    """Test the to_dict method of Scene model."""
    scene = SceneFactory(content={"test": "data"})
    session.commit()

    scene_dict = scene.to_dict()
    assert isinstance(scene_dict, dict)
    assert scene_dict["id"] == scene.id
    assert scene_dict["name"] == scene.name
    assert scene_dict["description"] == scene.description
    assert scene_dict["sequence"] == scene.sequence
    assert scene_dict["content"] == {"test": "data"}
    assert scene_dict["storyboard_id"] == scene.storyboard.id
    assert isinstance(scene_dict["created_at"], str)
    assert isinstance(scene_dict["updated_at"], str)


def test_scene_relationships(session):
    """Test scene relationships with other models."""
    scene = SceneFactory()
    visual_effects = [VisualEffectFactory(scene=scene) for _ in range(2)]
    audio_tracks = [AudioTrackFactory(scene=scene) for _ in range(2)]
    session.commit()

    # Test storyboard relationship
    assert scene.storyboard is not None
    assert hasattr(scene.storyboard, "id")
    assert hasattr(scene.storyboard, "name")

    # Test visual effects relationship
    assert len(scene.visual_effects) == 2
    assert all(isinstance(effect, VisualEffect) for effect in scene.visual_effects)
    assert all(effect.scene_id == scene.id for effect in scene.visual_effects)

    # Test audio tracks relationship
    assert len(scene.audio_tracks) == 2
    assert all(isinstance(track, AudioTrack) for track in scene.audio_tracks)
    assert all(track.scene_id == scene.id for track in scene.audio_tracks)


def test_scene_cascade_delete(session):
    """Test that deleting a scene cascades to related models."""
    scene = SceneFactory()
    visual_effects = [VisualEffectFactory(scene=scene) for _ in range(2)]
    audio_tracks = [AudioTrackFactory(scene=scene) for _ in range(2)]
    session.commit()

    # Store IDs for verification
    scene_id = scene.id
    effect_ids = [effect.id for effect in visual_effects]
    track_ids = [track.id for track in audio_tracks]

    # Delete the scene
    session.delete(scene)
    session.commit()

    # Verify scene is deleted
    assert Scene.query.get(scene_id) is None

    # Verify related effects and tracks are deleted
    from backend.app.models import VisualEffect, AudioTrack

    for effect_id in effect_ids:
        assert VisualEffect.query.get(effect_id) is None
    for track_id in track_ids:
        assert AudioTrack.query.get(track_id) is None


def test_scene_validation(session):
    """Test scene model validation."""
    storyboard = StoryboardFactory()

    # Test name is required
    with pytest.raises(Exception):
        scene = Scene(description="Test", storyboard=storyboard, sequence=1)
        session.add(scene)
        session.commit()

    # Test storyboard is required
    with pytest.raises(Exception):
        scene = Scene(name="Test", description="Test", sequence=1)
        session.add(scene)
        session.commit()

    # Test sequence is required
    with pytest.raises(Exception):
        scene = Scene(name="Test", description="Test", storyboard=storyboard)
        session.add(scene)
        session.commit()


def test_scene_content_validation(session):
    """Test scene content validation."""
    # Test invalid JSON content
    with pytest.raises(Exception):
        scene = SceneFactory(content="invalid json")
        session.commit()

    # Test valid JSON content
    scene = SceneFactory(content={"valid": "json"})
    session.commit()
    assert scene.content == {"valid": "json"}


def test_scene_sequence_ordering(session):
    """Test scene sequence ordering within a storyboard."""
    storyboard = StoryboardFactory()
    scenes = [SceneFactory(storyboard=storyboard, sequence=i) for i in range(3)]
    session.commit()

    # Test automatic reordering when inserting a scene in the middle
    new_scene = SceneFactory(storyboard=storyboard, sequence=1)
    session.commit()

    # Verify sequences were adjusted
    scenes = (
        Scene.query.filter_by(storyboard_id=storyboard.id)
        .order_by(Scene.sequence)
        .all()
    )
    assert [scene.sequence for scene in scenes] == [0, 1, 2, 3]


def test_scene_duplicate_sequence(session):
    """Test handling of duplicate sequence numbers."""
    storyboard = StoryboardFactory()
    scene1 = SceneFactory(storyboard=storyboard, sequence=1)
    session.commit()

    # Try to create another scene with the same sequence
    with pytest.raises(Exception):
        scene2 = SceneFactory(storyboard=storyboard, sequence=1)
        session.commit()
