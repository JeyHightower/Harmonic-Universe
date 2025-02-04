"""
Test database functionality and model relationships.
"""
import pytest
from uuid import uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import text
from app.models.user import User
from app.models.universe import Universe
from app.models.scene import Scene, RenderingMode
from app.models.scene_object import SceneObject, SceneObjectType
from app.models.audio_file import AudioFile, AudioFormat, AudioType
from app.models.timeline import Timeline
from app.models.keyframe import Keyframe, ParameterType

def test_database_connection(db_session: Session):
    """Test database connection and basic query."""
    result = db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1

def test_user_creation(db_session: Session):
    """Test user model creation and relationships."""
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.is_active is True
    assert user.created_at is not None
    assert user.updated_at is not None

def test_universe_creation_with_user(db_session: Session, test_user: User):
    """Test universe creation with user relationship."""
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        creator_id=test_user.id,
        physics_json={},
        music_parameters={}
    )
    db_session.add(universe)
    db_session.commit()
    db_session.refresh(universe)

    assert universe.id is not None
    assert universe.name == "Test Universe"
    assert universe.creator_id == test_user.id

def test_scene_creation_with_relationships(db_session: Session, test_universe: Universe, test_user: User):
    """Test scene creation with universe and user relationships."""
    scene = Scene(
        name="Test Scene",
        description="Test Description",
        universe_id=test_universe.id,
        creator_id=test_user.id,
        rendering_mode=RenderingMode.WIREFRAME,
        settings={},
        data={}
    )
    db_session.add(scene)
    db_session.commit()
    db_session.refresh(scene)

    assert scene.id is not None
    assert scene.name == "Test Scene"
    assert scene.universe_id == test_universe.id
    assert scene.creator_id == test_user.id

def test_audio_file_creation(db_session: Session, test_user: User, test_universe: Universe):
    """Test audio file creation and relationships."""
    audio = AudioFile(
        name="test.mp3",
        description="Test audio file",
        format=AudioFormat.MP3,
        type=AudioType.MUSIC,
        duration=120.5,
        sample_rate=44100,
        channels=2,
        bit_depth=16,
        file_path="/path/to/test.mp3",
        creator_id=test_user.id,
        universe_id=test_universe.id,
        audio_metadata={}
    )
    db_session.add(audio)
    db_session.commit()
    db_session.refresh(audio)

    assert audio.id is not None
    assert audio.name == "test.mp3"
    assert audio.creator_id == test_user.id

def test_scene_object_creation(db_session: Session, test_scene: Scene):
    """Test scene object creation and relationships."""
    obj = SceneObject(
        name="Test Object",
        type=SceneObjectType.MESH,
        scene_id=test_scene.id,
        properties={},
        object_metadata={}
    )
    db_session.add(obj)
    db_session.commit()
    db_session.refresh(obj)

    assert obj.id is not None
    assert obj.name == "Test Object"
    assert obj.scene_id == test_scene.id

def test_timeline_creation(db_session: Session, test_scene: Scene):
    """Test timeline creation and relationships."""
    timeline = Timeline(
        name="Test Timeline",
        description="Test timeline",
        duration=60.0,
        scene_id=test_scene.id,
        settings={}
    )
    db_session.add(timeline)
    db_session.commit()
    db_session.refresh(timeline)

    assert timeline.id is not None
    assert timeline.name == "Test Timeline"
    assert timeline.scene_id == test_scene.id

def test_keyframe_creation(db_session: Session, test_timeline: Timeline):
    """Test keyframe creation and relationships."""
    keyframe = Keyframe(
        timestamp=30.0,
        data={},
        storyboard_id=uuid4(),
        animation_id=test_timeline.id
    )
    db_session.add(keyframe)
    db_session.commit()
    db_session.refresh(keyframe)

    assert keyframe.id is not None
    assert keyframe.animation_id == test_timeline.id
    assert keyframe.timestamp == 30.0

def test_cascade_delete(db_session: Session, test_universe: Universe):
    """Test cascade delete functionality."""
    # Create a scene
    scene = Scene(
        name="Test Scene",
        description="Test Description",
        universe_id=test_universe.id,
        creator_id=test_universe.creator_id,
        rendering_mode=RenderingMode.WIREFRAME,
        settings={},
        data={}
    )
    db_session.add(scene)
    db_session.commit()

    # Create a scene object
    obj = SceneObject(
        name="Test Object",
        type=SceneObjectType.MESH,
        scene_id=scene.id,
        properties={},
        object_metadata={}
    )
    db_session.add(obj)
    db_session.commit()

    # Delete the universe
    db_session.delete(test_universe)
    db_session.commit()

    # Verify cascade delete
    assert db_session.query(Scene).filter_by(id=scene.id).first() is None
    assert db_session.query(SceneObject).filter_by(id=obj.id).first() is None

def test_query_performance(db_session: Session, test_universe: Universe):
    """Test query performance with joins."""
    # Create multiple scenes
    for i in range(5):
        scene = Scene(
            name=f"Scene {i}",
            description=f"Description {i}",
            universe_id=test_universe.id,
            creator_id=test_universe.creator_id,
            rendering_mode=RenderingMode.WIREFRAME,
            settings={},
            data={}
        )
        db_session.add(scene)
    db_session.commit()

    # Test eager loading
    universe = db_session.query(Universe).filter_by(id=test_universe.id).first()
    assert len(universe.scenes) == 5  # Should not trigger additional queries

if __name__ == "__main__":
    # Run tests
    test_database_connection()
    test_user_creation()
    test_universe_creation_with_user()
    test_scene_creation_with_relationships()
    test_audio_file_creation()
    test_scene_object_creation()
    test_timeline_creation()
    test_keyframe_creation()
    test_cascade_delete()
    test_query_performance()
    print("All tests passed!")
