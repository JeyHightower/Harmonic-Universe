"""Tests for Scene model."""
import pytest
from datetime import datetime
from app.models.scene import Scene
from app.models.storyboard import Storyboard
from app.models.universe import Universe
from app.models.user import User
from sqlalchemy.exc import IntegrityError

def test_new_scene(session, test_storyboard):
    """Test creating a new scene"""
    scene = Scene(
        title="Test Scene",
        content="Test scene content",
        storyboard_id=test_storyboard.id,
        order=1
    )
    session.add(scene)
    session.commit()

    assert scene.title == "Test Scene"
    assert scene.content == "Test scene content"
    assert scene.storyboard_id == test_storyboard.id
    assert scene.order == 1
    assert scene.storyboard == test_storyboard
    assert scene in test_storyboard.scenes

def test_scene_to_dict(session, test_scene):
    """Test converting a scene to dictionary"""
    scene_dict = test_scene.to_dict()

    assert scene_dict["title"] == "Test Scene"
    assert scene_dict["content"] == "Test scene content"
    assert scene_dict["storyboard_id"] == test_scene.storyboard_id
    assert scene_dict["order"] == 1

def test_scene_validation(session, test_storyboard):
    """Test scene validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        scene = Scene(content="Missing title")
        session.add(scene)
        session.commit()
    session.rollback()

    # Test duplicate order in same storyboard
    scene1 = Scene(
        title="First Scene",
        content="First scene content",
        storyboard_id=test_storyboard.id,
        order=1
    )
    session.add(scene1)
    session.commit()

    with pytest.raises(IntegrityError):
        scene2 = Scene(
            title="Second Scene",
            content="Second scene content",
            storyboard_id=test_storyboard.id,
            order=1  # Same order as scene1
        )
        session.add(scene2)
        session.commit()
    session.rollback()

def test_scene_relationships(session, test_storyboard, test_scene):
    """Test scene relationships"""
    # Test storyboard relationship
    assert test_scene.storyboard == test_storyboard
    assert test_scene in test_storyboard.scenes

    # Test cascade delete
    session.delete(test_storyboard)
    session.commit()

    # Scene should be deleted when storyboard is deleted
    assert session.query(Scene).filter_by(id=test_scene.id).first() is None

def test_scene_ordering(session, test_storyboard):
    """Test scene ordering within storyboard"""
    # Create multiple scenes with different orders
    scene1 = Scene(
        title="Scene 1",
        content="First scene",
        storyboard_id=test_storyboard.id,
        order=1
    )
    scene2 = Scene(
        title="Scene 2",
        content="Second scene",
        storyboard_id=test_storyboard.id,
        order=2
    )
    scene3 = Scene(
        title="Scene 3",
        content="Third scene",
        storyboard_id=test_storyboard.id,
        order=3
    )

    session.add_all([scene1, scene2, scene3])
    session.commit()

    # Test ordering
    scenes = test_storyboard.scenes.order_by(Scene.order).all()
    assert len(scenes) == 3
    assert scenes[0].title == "Scene 1"
    assert scenes[1].title == "Scene 2"
    assert scenes[2].title == "Scene 3"

    # Test reordering
    scene2.order = 1
    scene1.order = 2
    session.commit()

    scenes = test_storyboard.scenes.order_by(Scene.order).all()
    assert scenes[0].title == "Scene 2"
    assert scenes[1].title == "Scene 1"
    assert scenes[2].title == "Scene 3"

def test_scene_content_validation():
    """Test scene content validation."""
    # Test content structure validation
    with pytest.raises(ValueError) as excinfo:
        Scene(
            storyboard_id=1,
            title='Test Scene',
            content='invalid content',  # Should be a dict
            sequence=1
        )
    assert "content" in str(excinfo.value).lower()

    # Test required content fields
    with pytest.raises(ValueError) as excinfo:
        Scene(
            storyboard_id=1,
            title='Test Scene',
            content={},  # Missing required fields
            sequence=1
        )
    assert "content" in str(excinfo.value).lower()
