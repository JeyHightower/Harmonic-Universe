"""Tests for PhysicsConstraint model."""
import pytest
from datetime import datetime
from app.models import PhysicsConstraint, PhysicsObject, Scene
from sqlalchemy.exc import IntegrityError

def test_create_physics_constraint(session, test_scene):
    """Test creating a new physics constraint."""
    # Create two physics objects
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name="Object A",
        object_type="circle",
        position={"x": 0, "y": 0},
        dimensions={"radius": 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name="Object B",
        object_type="circle",
        position={"x": 100, "y": 0},
        dimensions={"radius": 25}
    )
    session.add_all([object_a, object_b])
    session.commit()

    constraint = PhysicsConstraint(
        scene_id=test_scene.id,
        object_a_id=object_a.id,
        object_b_id=object_b.id,
        name="Test Constraint",
        constraint_type="distance",
        anchor_a={"x": 0, "y": 0},
        anchor_b={"x": 0, "y": 0}
    )
    session.add(constraint)
    session.commit()

    assert constraint.id is not None
    assert constraint.name == "Test Constraint"
    assert constraint.constraint_type == "distance"
    assert constraint.scene_id == test_scene.id
    assert constraint.object_a_id == object_a.id
    assert constraint.object_b_id == object_b.id
    assert constraint.scene == test_scene
    assert constraint.object_a == object_a
    assert constraint.object_b == object_b
    assert constraint in object_a.constraints_as_a
    assert constraint in object_b.constraints_as_b

def test_default_values(session, test_scene):
    """Test default values for physics constraint."""
    # Create two physics objects
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name="Object A",
        object_type="circle",
        position={"x": 0, "y": 0},
        dimensions={"radius": 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name="Object B",
        object_type="circle",
        position={"x": 100, "y": 0},
        dimensions={"radius": 25}
    )
    session.add_all([object_a, object_b])
    session.commit()

    constraint = PhysicsConstraint(
        scene_id=test_scene.id,
        object_a_id=object_a.id,
        object_b_id=object_b.id,
        name="Test Constraint",
        constraint_type="distance",
        anchor_a={"x": 0, "y": 0},
        anchor_b={"x": 0, "y": 0}
    )
    session.add(constraint)
    session.commit()

    assert constraint.stiffness == 1.0
    assert constraint.damping == 0.7
    assert constraint.properties == {
        "min_length": None,
        "max_length": None,
        "angle_limits": None,
        "axis": {"x": 1, "y": 0},
        "translation_limits": None
    }

def test_constraint_type_validation(session, test_scene):
    """Test constraint type validation."""
    # Create two physics objects
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name="Object A",
        object_type="circle",
        position={"x": 0, "y": 0},
        dimensions={"radius": 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name="Object B",
        object_type="circle",
        position={"x": 100, "y": 0},
        dimensions={"radius": 25}
    )
    session.add_all([object_a, object_b])
    session.commit()

    # Test invalid constraint type
    with pytest.raises(ValueError) as excinfo:
        constraint = PhysicsConstraint(
            scene_id=test_scene.id,
            object_a_id=object_a.id,
            object_b_id=object_b.id,
            name="Test Constraint",
            constraint_type="invalid_type",
            anchor_a={"x": 0, "y": 0},
            anchor_b={"x": 0, "y": 0}
        )
        constraint.validate_constraint_type()
    assert "Invalid constraint type" in str(excinfo.value)

    # Test distance constraint validation
    with pytest.raises(ValueError) as excinfo:
        constraint = PhysicsConstraint(
            scene_id=test_scene.id,
            object_a_id=object_a.id,
            object_b_id=object_b.id,
            name="Test Constraint",
            constraint_type="distance",
            anchor_a={"x": 0, "y": 0},
            anchor_b={"x": 0, "y": 0},
            properties={"min_length": "invalid"}
        )
        constraint.validate_constraint_type()
    assert "min_length must be a number" in str(excinfo.value)

    # Test revolute constraint validation
    with pytest.raises(ValueError) as excinfo:
        constraint = PhysicsConstraint(
            scene_id=test_scene.id,
            object_a_id=object_a.id,
            object_b_id=object_b.id,
            name="Test Constraint",
            constraint_type="revolute",
            anchor_a={"x": 0, "y": 0},
            anchor_b={"x": 0, "y": 0},
            properties={"angle_limits": {"min": 2, "max": 1}}
        )
        constraint.validate_constraint_type()
    assert "angle_limits.max must be greater than angle_limits.min" in str(excinfo.value)

    # Test prismatic constraint validation
    with pytest.raises(ValueError) as excinfo:
        constraint = PhysicsConstraint(
            scene_id=test_scene.id,
            object_a_id=object_a.id,
            object_b_id=object_b.id,
            name="Test Constraint",
            constraint_type="prismatic",
            anchor_a={"x": 0, "y": 0},
            anchor_b={"x": 0, "y": 0},
            properties={"axis": {"x": "invalid", "y": 0}}
        )
        constraint.validate_constraint_type()
    assert "axis components must be numbers" in str(excinfo.value)

def test_cascade_delete(session, test_scene):
    """Test cascade deletion."""
    # Create two physics objects
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name="Object A",
        object_type="circle",
        position={"x": 0, "y": 0},
        dimensions={"radius": 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name="Object B",
        object_type="circle",
        position={"x": 100, "y": 0},
        dimensions={"radius": 25}
    )
    session.add_all([object_a, object_b])
    session.commit()

    constraint = PhysicsConstraint(
        scene_id=test_scene.id,
        object_a_id=object_a.id,
        object_b_id=object_b.id,
        name="Test Constraint",
        constraint_type="distance",
        anchor_a={"x": 0, "y": 0},
        anchor_b={"x": 0, "y": 0}
    )
    session.add(constraint)
    session.commit()

    # Store IDs for verification
    constraint_id = constraint.id
    object_a_id = object_a.id
    object_b_id = object_b.id
    scene_id = test_scene.id

    # Delete scene
    session.delete(test_scene)
    session.commit()

    # Verify everything is deleted
    assert session.query(PhysicsConstraint).filter_by(id=constraint_id).first() is None
    assert session.query(PhysicsObject).filter_by(id=object_a_id).first() is None
    assert session.query(PhysicsObject).filter_by(id=object_b_id).first() is None
    assert session.query(Scene).filter_by(id=scene_id).first() is None

def test_to_dict(session, test_scene):
    """Test converting physics constraint to dictionary."""
    # Create two physics objects
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name="Object A",
        object_type="circle",
        position={"x": 0, "y": 0},
        dimensions={"radius": 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name="Object B",
        object_type="circle",
        position={"x": 100, "y": 0},
        dimensions={"radius": 25}
    )
    session.add_all([object_a, object_b])
    session.commit()

    constraint = PhysicsConstraint(
        scene_id=test_scene.id,
        object_a_id=object_a.id,
        object_b_id=object_b.id,
        name="Test Constraint",
        constraint_type="distance",
        anchor_a={"x": 0, "y": 0},
        anchor_b={"x": 0, "y": 0}
    )
    session.add(constraint)
    session.commit()

    constraint_dict = constraint.to_dict()
    assert isinstance(constraint_dict, dict)
    assert constraint_dict['id'] == constraint.id
    assert constraint_dict['scene_id'] == test_scene.id
    assert constraint_dict['object_a_id'] == object_a.id
    assert constraint_dict['object_b_id'] == object_b.id
    assert constraint_dict['name'] == "Test Constraint"
    assert constraint_dict['constraint_type'] == "distance"
    assert constraint_dict['anchor_a'] == {"x": 0, "y": 0}
    assert constraint_dict['anchor_b'] == {"x": 0, "y": 0}
    assert isinstance(constraint_dict['created_at'], str)
    assert isinstance(constraint_dict['updated_at'], str)
