import pytest
from app.models.storyboard import Storyboard
from app.models.scene import Scene
from sqlalchemy.exc import IntegrityError

def test_new_storyboard(session, test_universe):
    """Test creating a new storyboard"""
    storyboard = Storyboard(
        title="Test Storyboard",
        description="A test storyboard",
        universe_id=test_universe.id
    )
    session.add(storyboard)
    session.commit()

    assert storyboard.title == "Test Storyboard"
    assert storyboard.description == "A test storyboard"
    assert storyboard.universe_id == test_universe.id
    assert storyboard.universe == test_universe
    assert storyboard in test_universe.storyboards

def test_storyboard_to_dict(session, test_storyboard):
    """Test converting a storyboard to dictionary"""
    storyboard_dict = test_storyboard.to_dict()

    assert storyboard_dict["title"] == "Test Storyboard"
    assert storyboard_dict["description"] == "A test storyboard"
    assert storyboard_dict["universe_id"] == test_storyboard.universe_id

def test_storyboard_validation(session, test_universe):
    """Test storyboard validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        storyboard = Storyboard(description="Missing title")
        session.add(storyboard)
        session.commit()
    session.rollback()

    # Test duplicate title in same universe
    storyboard1 = Storyboard(
        title="Same Title",
        description="First storyboard",
        universe_id=test_universe.id
    )
    session.add(storyboard1)
    session.commit()

    with pytest.raises(IntegrityError):
        storyboard2 = Storyboard(
            title="Same Title",
            description="Second storyboard",
            universe_id=test_universe.id
        )
        session.add(storyboard2)
        session.commit()
    session.rollback()

def test_storyboard_relationships(session, test_universe, test_storyboard, test_scene):
    """Test storyboard relationships"""
    # Test universe relationship
    assert test_storyboard.universe == test_universe
    assert test_storyboard in test_universe.storyboards

    # Test scenes relationship
    assert test_scene in test_storyboard.scenes
    assert test_scene.storyboard == test_storyboard

    # Test cascade delete
    session.delete(test_universe)
    session.commit()

    # Storyboard should be deleted when universe is deleted
    assert session.query(Storyboard).filter_by(id=test_storyboard.id).first() is None

def test_storyboard_scene_management(session, test_storyboard):
    """Test managing scenes in a storyboard"""
    # Create multiple scenes
    scene1 = Scene(
        title="Scene 1",
        content="First scene content",
        storyboard_id=test_storyboard.id,
        order=1
    )
    scene2 = Scene(
        title="Scene 2",
        content="Second scene content",
        storyboard_id=test_storyboard.id,
        order=2
    )

    session.add_all([scene1, scene2])
    session.commit()

    # Test scene retrieval
    scenes = test_storyboard.scenes.order_by(Scene.order).all()
    assert len(scenes) == 2
    assert scenes[0].title == "Scene 1"
    assert scenes[1].title == "Scene 2"

    # Test scene deletion
    session.delete(scene1)
    session.commit()

    scenes = test_storyboard.scenes.all()
    assert len(scenes) == 1
    assert scenes[0].title == "Scene 2"
