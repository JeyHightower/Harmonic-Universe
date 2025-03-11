"""Tests for PhysicsObject model."""
import pytest
from datetime import datetime
from app.models import PhysicsObject, Scene, Storyboard, Universe
from sqlalchemy.exc import IntegrityError


def test_create_physics_object(session, test_scene):
    """Test creating a new physics object."""
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name="Test Object",
        object_type="circle",
        mass=1.0,
        position={"x": 0, "y": 0},
        dimensions={"radius": 25},
    )
    session.add(physics_object)
    session.commit()

    assert physics_object.id is not None
    assert physics_object.name == "Test Object"
    assert physics_object.object_type == "circle"
    assert physics_object.mass == 1.0
    assert physics_object.position == {"x": 0, "y": 0}
    assert physics_object.dimensions == {"radius": 25}
    assert physics_object.scene_id == test_scene.id
    assert physics_object.scene == test_scene
    assert physics_object in test_scene.physics_objects


def test_default_values(session, test_scene):
    """Test default values for physics object."""
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name="Test Object",
        object_type="circle",
        position={"x": 0, "y": 0},
        dimensions={"radius": 25},
    )
    session.add(physics_object)
    session.commit()

    assert physics_object.mass == 1.0
    assert physics_object.velocity == {"x": 0, "y": 0}
    assert physics_object.acceleration == {"x": 0, "y": 0}
    assert physics_object.angle == 0
    assert physics_object.angular_velocity == 0
    assert physics_object.restitution == 0.6
    assert physics_object.friction == 0.1
    assert physics_object.is_static is False
    assert physics_object.is_sensor is False
    assert physics_object.collision_filter == {
        "category": 1,
        "mask": 0xFFFFFFFF,
        "group": 0,
    }


def test_object_type_validation(session, test_scene):
    """Test object type validation."""
    # Test invalid object type
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="invalid_type",
            position={"x": 0, "y": 0},
            dimensions={"radius": 25},
        )
        physics_object.validate_object_type()
    assert "Invalid object type" in str(excinfo.value)

    # Test circle validation
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="circle",
            position={"x": 0, "y": 0},
            dimensions={"width": 50},  # Missing radius
        )
        physics_object.validate_object_type()
    assert "radius dimension" in str(excinfo.value)

    # Test rectangle validation
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="rectangle",
            position={"x": 0, "y": 0},
            dimensions={"width": 50},  # Missing height
        )
        physics_object.validate_object_type()
    assert "width and height dimensions" in str(excinfo.value)

    # Test polygon validation
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="polygon",
            position={"x": 0, "y": 0},
            dimensions={"vertices": [{"x": 0, "y": 0}]},  # Not enough vertices
        )
        physics_object.validate_object_type()
    assert "at least 3 vertices" in str(excinfo.value)


def test_physics_properties_validation(session, test_scene):
    """Test physics properties validation."""
    # Test invalid mass
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="circle",
            mass=-1.0,
            position={"x": 0, "y": 0},
            dimensions={"radius": 25},
        )
    assert "Mass must be positive" in str(excinfo.value)

    # Test invalid density
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="circle",
            density=-0.1,
            position={"x": 0, "y": 0},
            dimensions={"radius": 25},
        )
    assert "Density must be positive" in str(excinfo.value)

    # Test invalid restitution
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="circle",
            restitution=1.5,
            position={"x": 0, "y": 0},
            dimensions={"radius": 25},
        )
    assert "Restitution must be between 0 and 1" in str(excinfo.value)

    # Test invalid friction
    with pytest.raises(ValueError) as excinfo:
        physics_object = PhysicsObject(
            scene_id=test_scene.id,
            name="Test Object",
            object_type="circle",
            friction=-0.5,
            position={"x": 0, "y": 0},
            dimensions={"radius": 25},
        )
    assert "Friction must be non-negative" in str(excinfo.value)


def test_cascade_delete(session, test_scene):
    """Test cascade deletion."""
    # Create physics object
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name="Test Object",
        object_type="circle",
        position={"x": 0, "y": 0},
        dimensions={"radius": 25},
    )
    session.add(physics_object)
    session.commit()

    # Store IDs and refresh objects
    object_id = physics_object.id
    scene_id = test_scene.id
    session.refresh(test_scene)
    session.refresh(physics_object)

    # Verify the relationship is set up correctly
    assert physics_object in test_scene.physics_objects

    # Delete scene
    session.delete(test_scene)
    session.commit()

    # Clear session to ensure fresh state
    session.expire_all()

    # Verify deletions
    assert session.get(Scene, scene_id) is None, "Scene should be deleted"
    assert (
        session.get(PhysicsObject, object_id) is None
    ), "PhysicsObject should be deleted"


def test_apply_force(session, test_scene):
    """Test applying force to physics object."""
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name="Test Object",
        object_type="circle",
        mass=2.0,
        position={"x": 0, "y": 0},
        dimensions={"radius": 25},
    )
    session.add(physics_object)
    session.commit()

    # Apply force
    physics_object.apply_force(10, -5)

    # Check acceleration (F = ma)
    assert physics_object.acceleration["x"] == 5  # 10/2
    assert physics_object.acceleration["y"] == -2.5  # -5/2

    # Test that static objects don't accelerate
    physics_object.is_static = True
    physics_object.apply_force(10, -5)

    # Acceleration should remain unchanged
    assert physics_object.acceleration["x"] == 5
    assert physics_object.acceleration["y"] == -2.5


def test_to_dict(session, test_scene):
    """Test converting physics object to dictionary."""
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name="Test Object",
        object_type="circle",
        mass=1.0,
        position={"x": 0, "y": 0},
        dimensions={"radius": 25},
    )
    session.add(physics_object)
    session.commit()

    obj_dict = physics_object.to_dict()
    assert isinstance(obj_dict, dict)
    assert obj_dict["id"] == physics_object.id
    assert obj_dict["scene_id"] == test_scene.id
    assert obj_dict["name"] == "Test Object"
    assert obj_dict["object_type"] == "circle"
    assert obj_dict["mass"] == 1.0
    assert obj_dict["position"] == {"x": 0, "y": 0}
    assert obj_dict["dimensions"] == {"radius": 25}
    assert isinstance(obj_dict["created_at"], str)
    assert isinstance(obj_dict["updated_at"], str)
