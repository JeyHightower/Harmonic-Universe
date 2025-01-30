"""Tests for Scene model."""
import pytest
from datetime import datetime
from app.models import Scene, PhysicsObject, PhysicsConstraint
from sqlalchemy.exc import IntegrityError

def test_scene_physics_settings(session, test_scene):
    """Test physics settings in scene."""
    # Test default physics settings
    assert test_scene.physics_settings == {
        "gravity": {"x": 0, "y": -9.81},
        "time_step": 1/60,
        "velocity_iterations": 8,
        "position_iterations": 3,
        "enabled": False
    }

    # Test updating physics settings
    test_scene.physics_settings = {
        "gravity": {"x": 0, "y": -5},
        "time_step": 1/30,
        "velocity_iterations": 4,
        "position_iterations": 2,
        "enabled": True
    }
    session.commit()

    # Reload scene from database
    scene = session.query(Scene).get(test_scene.id)
    assert scene.physics_settings["gravity"]["y"] == -5
    assert scene.physics_settings["time_step"] == 1/30
    assert scene.physics_settings["velocity_iterations"] == 4
    assert scene.physics_settings["position_iterations"] == 2
    assert scene.physics_settings["enabled"] is True

def test_scene_physics_relationships(session, test_scene):
    """Test scene relationships with physics objects and constraints."""
    # Create physics objects
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

    # Create constraint
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

    # Test relationships
    assert len(test_scene.physics_objects) == 2
    assert object_a in test_scene.physics_objects
    assert object_b in test_scene.physics_objects

    assert len(test_scene.physics_constraints) == 1
    assert constraint in test_scene.physics_constraints

    # Test cascade deletion
    session.delete(test_scene)
    session.commit()

    assert session.query(PhysicsObject).filter_by(id=object_a.id).first() is None
    assert session.query(PhysicsObject).filter_by(id=object_b.id).first() is None
    assert session.query(PhysicsConstraint).filter_by(id=constraint.id).first() is None

def test_scene_to_dict_with_physics(session, test_scene):
    """Test scene to_dict method includes physics data."""
    # Create physics objects and constraint
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

    scene_dict = test_scene.to_dict()
    assert 'physics_settings' in scene_dict
    assert 'physics_objects' in scene_dict
    assert 'physics_constraints' in scene_dict

    assert len(scene_dict['physics_objects']) == 2
    assert len(scene_dict['physics_constraints']) == 1

    physics_object = scene_dict['physics_objects'][0]
    assert 'id' in physics_object
    assert 'name' in physics_object
    assert 'object_type' in physics_object
    assert 'position' in physics_object
    assert 'dimensions' in physics_object

    physics_constraint = scene_dict['physics_constraints'][0]
    assert 'id' in physics_constraint
    assert 'name' in physics_constraint
    assert 'constraint_type' in physics_constraint
    assert 'object_a_id' in physics_constraint
    assert 'object_b_id' in physics_constraint
