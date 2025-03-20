"""Tests for media effects models (Visual Effects and Audio Tracks)."""
import pytest
from datetime import datetime, timezone
from backend.app.models import VisualEffect, AudioTrack
from tests.factories import VisualEffectFactory, AudioTrackFactory, SceneFactory


def test_create_visual_effect(session):
    """Test creating a new visual effect."""
    scene = SceneFactory()
    effect = VisualEffectFactory(
        name="Test Effect",
        effect_type="particle",
        parameters={"speed": 1.0, "size": 2.0},
        scene=scene,
    )
    session.commit()

    assert effect.id is not None
    assert effect.name == "Test Effect"
    assert effect.effect_type == "particle"
    assert effect.parameters == {"speed": 1.0, "size": 2.0}
    assert effect.scene == scene
    assert isinstance(effect.created_at, datetime)
    assert isinstance(effect.updated_at, datetime)


def test_create_audio_track(session):
    """Test creating a new audio track."""
    scene = SceneFactory()
    track = AudioTrackFactory(
        name="Test Track",
        track_type="background",
        file_path="audio/test.mp3",
        parameters={"volume": 0.8, "loop": True},
        scene=scene,
    )
    session.commit()

    assert track.id is not None
    assert track.name == "Test Track"
    assert track.track_type == "background"
    assert track.file_path == "audio/test.mp3"
    assert track.parameters == {"volume": 0.8, "loop": True}
    assert track.scene == scene
    assert isinstance(track.created_at, datetime)
    assert isinstance(track.updated_at, datetime)


def test_visual_effect_to_dict(session):
    """Test the to_dict method of VisualEffect model."""
    effect = VisualEffectFactory(parameters={"test": "data"})
    session.commit()

    effect_dict = effect.to_dict()
    assert isinstance(effect_dict, dict)
    assert effect_dict["id"] == effect.id
    assert effect_dict["name"] == effect.name
    assert effect_dict["effect_type"] == effect.effect_type
    assert effect_dict["parameters"] == {"test": "data"}
    assert effect_dict["scene_id"] == effect.scene.id
    assert isinstance(effect_dict["created_at"], str)
    assert isinstance(effect_dict["updated_at"], str)


def test_audio_track_to_dict(session):
    """Test the to_dict method of AudioTrack model."""
    track = AudioTrackFactory(parameters={"test": "data"})
    session.commit()

    track_dict = track.to_dict()
    assert isinstance(track_dict, dict)
    assert track_dict["id"] == track.id
    assert track_dict["name"] == track.name
    assert track_dict["track_type"] == track.track_type
    assert track_dict["file_path"] == track.file_path
    assert track_dict["parameters"] == {"test": "data"}
    assert track_dict["scene_id"] == track.scene.id
    assert isinstance(track_dict["created_at"], str)
    assert isinstance(track_dict["updated_at"], str)


def test_visual_effect_validation(session):
    """Test visual effect model validation."""
    scene = SceneFactory()

    # Test name is required
    with pytest.raises(Exception):
        effect = VisualEffect(effect_type="particle", scene=scene)
        session.add(effect)
        session.commit()

    # Test effect_type is required
    with pytest.raises(Exception):
        effect = VisualEffect(name="Test", scene=scene)
        session.add(effect)
        session.commit()

    # Test scene is required
    with pytest.raises(Exception):
        effect = VisualEffect(name="Test", effect_type="particle")
        session.add(effect)
        session.commit()

    # Test invalid effect_type
    with pytest.raises(Exception):
        effect = VisualEffectFactory(effect_type="invalid_type")
        session.commit()


def test_audio_track_validation(session):
    """Test audio track model validation."""
    scene = SceneFactory()

    # Test name is required
    with pytest.raises(Exception):
        track = AudioTrack(track_type="background", file_path="test.mp3", scene=scene)
        session.add(track)
        session.commit()

    # Test track_type is required
    with pytest.raises(Exception):
        track = AudioTrack(name="Test", file_path="test.mp3", scene=scene)
        session.add(track)
        session.commit()

    # Test file_path is required
    with pytest.raises(Exception):
        track = AudioTrack(name="Test", track_type="background", scene=scene)
        session.add(track)
        session.commit()

    # Test scene is required
    with pytest.raises(Exception):
        track = AudioTrack(name="Test", track_type="background", file_path="test.mp3")
        session.add(track)
        session.commit()

    # Test invalid track_type
    with pytest.raises(Exception):
        track = AudioTrackFactory(track_type="invalid_type")
        session.commit()


def test_visual_effect_parameters_validation(session):
    """Test visual effect parameters validation."""
    # Test invalid JSON parameters
    with pytest.raises(Exception):
        effect = VisualEffectFactory(parameters="invalid json")
        session.commit()

    # Test valid JSON parameters
    effect = VisualEffectFactory(parameters={"valid": "json"})
    session.commit()
    assert effect.parameters == {"valid": "json"}


def test_audio_track_parameters_validation(session):
    """Test audio track parameters validation."""
    # Test invalid JSON parameters
    with pytest.raises(Exception):
        track = AudioTrackFactory(parameters="invalid json")
        session.commit()

    # Test valid JSON parameters
    track = AudioTrackFactory(parameters={"valid": "json"})
    session.commit()
    assert track.parameters == {"valid": "json"}


def test_visual_effect_type_enum(session):
    """Test visual effect type enumeration."""
    # Test valid effect types
    valid_types = ["particle", "animation", "filter"]
    for effect_type in valid_types:
        effect = VisualEffectFactory(effect_type=effect_type)
        session.commit()
        assert effect.effect_type == effect_type


def test_audio_track_type_enum(session):
    """Test audio track type enumeration."""
    # Test valid track types
    valid_types = ["background", "effect", "voice"]
    for track_type in valid_types:
        track = AudioTrackFactory(track_type=track_type)
        session.commit()
        assert track.track_type == track_type


def test_cascade_delete_from_scene(session):
    """Test that deleting a scene cascades to media effects."""
    scene = SceneFactory()
    effects = [VisualEffectFactory(scene=scene) for _ in range(2)]
    tracks = [AudioTrackFactory(scene=scene) for _ in range(2)]
    session.commit()

    # Store IDs for verification
    effect_ids = [effect.id for effect in effects]
    track_ids = [track.id for track in tracks]

    # Delete the scene
    session.delete(scene)
    session.commit()

    # Verify effects and tracks are deleted
    for effect_id in effect_ids:
        assert VisualEffect.query.get(effect_id) is None
    for track_id in track_ids:
        assert AudioTrack.query.get(track_id) is None
