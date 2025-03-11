import pytest
from app.services.physics_service import PhysicsService
from app.models import PhysicsObject, PhysicsConstraint
from app.exceptions import PhysicsObjectNotFoundError


def test_create_physics_object(app, test_scene):
    """Test creating a physics object"""
    with app.app_context():
        service = PhysicsService()
        obj = service.create_physics_object(
            name="Test Object",
            object_type="circle",
            position={"x": 0, "y": 0},
            velocity={"x": 0, "y": 0},
            mass=1.0,
            restitution=0.5,
            friction=0.2,
            parameters={"radius": 10, "color": "#FF0000", "is_static": False},
            scene_id=test_scene.id,
        )

        assert obj.name == "Test Object"
        assert obj.object_type == "circle"
        assert obj.mass == 1.0


def test_create_physics_constraint(app, test_scene):
    """Test creating a physics constraint between objects"""
    with app.app_context():
        service = PhysicsService()

        # Create two objects to constrain
        obj1 = service.create_physics_object(
            name="Object 1",
            object_type="circle",
            position={"x": 0, "y": 0},
            velocity={"x": 0, "y": 0},
            mass=1.0,
            restitution=0.5,
            friction=0.2,
            parameters={"radius": 10},
            scene_id=test_scene.id,
        )

        obj2 = service.create_physics_object(
            name="Object 2",
            object_type="circle",
            position={"x": 100, "y": 0},
            velocity={"x": 0, "y": 0},
            mass=1.0,
            restitution=0.5,
            friction=0.2,
            parameters={"radius": 10},
            scene_id=test_scene.id,
        )

        constraint = service.create_physics_constraint(
            name="Test Constraint",
            constraint_type="distance",
            parameters={"stiffness": 1.0, "damping": 0.1, "length": 100},
            object_a_id=obj1.id,
            object_b_id=obj2.id,
            scene_id=test_scene.id,
        )

        assert constraint.name == "Test Constraint"
        assert constraint.constraint_type == "distance"
        assert constraint.object_a_id == obj1.id
        assert constraint.object_b_id == obj2.id


def test_update_physics_parameters(app, test_scene):
    """Test updating physics parameters"""
    with app.app_context():
        service = PhysicsService()
        obj = service.create_physics_object(
            name="Test Object",
            object_type="circle",
            position={"x": 0, "y": 0},
            velocity={"x": 0, "y": 0},
            mass=1.0,
            restitution=0.5,
            friction=0.2,
            parameters={"radius": 10},
            scene_id=test_scene.id,
        )

        updated = service.update_physics_parameters(
            obj.id, mass=2.0, restitution=0.8, friction=0.1
        )

        assert updated.mass == 2.0
        assert updated.restitution == 0.8
        assert updated.friction == 0.1


def test_simulate_physics(app, test_scene):
    """Test physics simulation step"""
    with app.app_context():
        service = PhysicsService()

        # Create an object with initial velocity
        obj = service.create_physics_object(
            name="Test Object",
            object_type="circle",
            position={"x": 0, "y": 0},
            velocity={"x": 1.0, "y": 0},
            mass=1.0,
            restitution=0.5,
            friction=0.2,
            parameters={"radius": 10},
            scene_id=test_scene.id,
        )

        # Simulate one step
        dt = 1.0 / 60.0  # 60 FPS
        updated_state = service.simulate_step(test_scene.id, dt)

        # Object should have moved in x direction
        assert updated_state[obj.id]["position"]["x"] > 0
