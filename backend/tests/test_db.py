"""
Test database functionality and model relationships.
"""
import pytest
from uuid import uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import text
from app.db.session import engine, SessionLocal, Base
from app.models.user import User
from app.models.universe import Universe
from app.models.scene import Scene, RenderingMode
from app.models.scene_object import SceneObject, SceneObjectType
from app.models.audio_file import AudioFile, AudioFormat, AudioType
from app.models.timeline import Timeline
from app.models.keyframe import Keyframe, ParameterType

def test_database_connection(db: Session):
    """Test database connection and basic query."""
    result = db.execute(text("SELECT 1"))
    assert result.scalar() == 1

def test_user_creation(db: Session):
    """Test user model creation and relationships."""
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        full_name="Test User",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.is_active is True
    assert user.created_at is not None
    assert user.updated_at is not None

def test_universe_creation_with_user(db: Session, test_user: User):
    """Test universe creation with user relationship."""
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        owner_id=test_user.id,
        settings={"theme": "dark"}
    )
    db.add(universe)
    db.commit()
    db.refresh(universe)

    assert universe.id is not None
    assert universe.name == "Test Universe"
    assert universe.owner_id == test_user.id
    assert universe.owner.email == test_user.email

def test_scene_creation_with_relationships(db: Session, test_universe: Universe, test_user: User):
    """Test scene creation with universe and user relationships."""
    scene = Scene(
        name="Test Scene",
        description="Test Description",
        universe_id=test_universe.id,
        creator_id=test_user.id,
        position={"x": 0, "y": 0, "z": 0},
        rotation={"x": 0, "y": 0, "z": 0},
        scale={"x": 1, "y": 1, "z": 1}
    )
    db.add(scene)
    db.commit()
    db.refresh(scene)

    assert scene.id is not None
    assert scene.name == "Test Scene"
    assert scene.universe_id == test_universe.id
    assert scene.creator_id == test_user.id
    assert scene.universe.name == test_universe.name
    assert scene.creator.email == test_user.email

def test_audio_file_creation(db: Session, test_user: User):
    """Test audio file creation and relationships."""
    audio = AudioFile(
        filename="test.mp3",
        file_path="/path/to/test.mp3",
        file_size=1024,
        duration=120.5,
        format="mp3",
        sample_rate=44100,
        channels=2,
        uploader_id=test_user.id
    )
    db.add(audio)
    db.commit()
    db.refresh(audio)

    assert audio.id is not None
    assert audio.filename == "test.mp3"
    assert audio.uploader_id == test_user.id
    assert audio.uploader.email == test_user.email

def test_scene_object_creation(db: Session, test_scene: Scene):
    """Test scene object creation and relationships."""
    obj = SceneObject(
        name="Test Object",
        object_type="mesh",
        scene_id=test_scene.id,
        position={"x": 0, "y": 0, "z": 0},
        rotation={"x": 0, "y": 0, "z": 0},
        scale={"x": 1, "y": 1, "z": 1},
        properties={"color": "#FF0000"}
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)

    assert obj.id is not None
    assert obj.name == "Test Object"
    assert obj.scene_id == test_scene.id
    assert obj.scene.name == test_scene.name

def test_timeline_creation(db: Session, test_scene: Scene):
    """Test timeline creation and relationships."""
    timeline = Timeline(
        name="Test Timeline",
        scene_id=test_scene.id,
        duration=60.0,
        settings={"loop": True}
    )
    db.add(timeline)
    db.commit()
    db.refresh(timeline)

    assert timeline.id is not None
    assert timeline.name == "Test Timeline"
    assert timeline.scene_id == test_scene.id
    assert timeline.scene.name == test_scene.name

def test_keyframe_creation(db: Session, test_timeline: Timeline):
    """Test keyframe creation and relationships."""
    keyframe = Keyframe(
        timeline_id=test_timeline.id,
        time=30.0,
        properties={"position": {"x": 1, "y": 1, "z": 1}},
        easing="linear"
    )
    db.add(keyframe)
    db.commit()
    db.refresh(keyframe)

    assert keyframe.id is not None
    assert keyframe.timeline_id == test_timeline.id
    assert keyframe.time == 30.0
    assert keyframe.timeline.name == test_timeline.name

def test_cascade_delete(db: Session, test_universe: Universe):
    """Test cascade delete functionality."""
    # Create a scene
    scene = Scene(
        name="Test Scene",
        description="Test Description",
        universe_id=test_universe.id,
        creator_id=test_universe.owner_id
    )
    db.add(scene)
    db.commit()

    # Create a scene object
    obj = SceneObject(
        name="Test Object",
        object_type="mesh",
        scene_id=scene.id
    )
    db.add(obj)
    db.commit()

    # Delete the universe
    db.delete(test_universe)
    db.commit()

    # Verify cascade delete
    assert db.query(Scene).filter_by(id=scene.id).first() is None
    assert db.query(SceneObject).filter_by(id=obj.id).first() is None

def test_query_performance(db: Session, test_universe: Universe):
    """Test query performance with joins."""
    # Create multiple scenes
    for i in range(5):
        scene = Scene(
            name=f"Scene {i}",
            description=f"Description {i}",
            universe_id=test_universe.id,
            creator_id=test_universe.owner_id
        )
        db.add(scene)
    db.commit()

    # Test eager loading
    universe = db.query(Universe).filter_by(id=test_universe.id).first()
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
