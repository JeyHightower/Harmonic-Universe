"""Test suite for physics engine functionality."""
import pytest
import math
from app.models import PhysicsObject, PhysicsConstraint
from app.physics import PhysicsEngine, CollisionDetector, ForceGenerator
from .factories import SceneFactory, PhysicsObjectFactory, PhysicsConstraintFactory

def test_physics_object_creation(client, scene, auth_headers):
    """Test physics object creation."""
    response = client.post(f'/api/scenes/{scene.id}/physics-objects',
        json={
            'name': 'Ball',
            'object_type': 'circle',
            'position': {'x': 0, 'y': 0},
            'dimensions': {'radius': 25},
            'mass': 1.0,
            'velocity': {'x': 0, 'y': 0},
            'acceleration': {'x': 0, 'y': 0},
            'angle': 0,
            'angular_velocity': 0,
            'density': 0.001,
            'restitution': 0.6,
            'friction': 0.1,
            'is_static': False,
            'is_sensor': False
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'Ball'
    assert response.json['object_type'] == 'circle'

    obj = PhysicsObject.query.get(response.json['id'])
    assert obj is not None
    assert obj.dimensions['radius'] == 25
    assert obj.mass == 1.0

def test_physics_constraint_creation(client, scene, auth_headers):
    """Test physics constraint creation."""
    # Create two objects to constrain
    obj1 = PhysicsObjectFactory(scene=scene)
    obj2 = PhysicsObjectFactory(scene=scene)

    response = client.post(f'/api/scenes/{scene.id}/physics-constraints',
        json={
            'name': 'Spring',
            'constraint_type': 'distance',
            'object_a_id': obj1.id,
            'object_b_id': obj2.id,
            'anchor_a': {'x': 0, 'y': 0},
            'anchor_b': {'x': 0, 'y': 0},
            'stiffness': 1.0,
            'damping': 0.7,
            'properties': {
                'min_length': 50,
                'max_length': 150
            }
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'Spring'
    assert response.json['constraint_type'] == 'distance'

    constraint = PhysicsConstraint.query.get(response.json['id'])
    assert constraint is not None
    assert constraint.stiffness == 1.0
    assert constraint.properties['min_length'] == 50

def test_physics_simulation_step(scene):
    """Test physics simulation step calculation."""
    engine = PhysicsEngine(scene)

    # Create a falling object
    obj = PhysicsObjectFactory(
        scene=scene,
        position={'x': 0, 'y': 100},
        velocity={'x': 0, 'y': 0},
        acceleration={'x': 0, 'y': -9.81}
    )

    # Simulate one step
    dt = 1/60  # 60 FPS
    engine.step(dt)

    # Verify object has moved according to physics
    assert obj.position['y'] < 100  # Should have fallen
    assert obj.velocity['y'] < 0    # Should have downward velocity

def test_collision_detection(scene):
    """Test collision detection between objects."""
    detector = CollisionDetector()

    # Create two overlapping circles
    obj1 = PhysicsObjectFactory(
        scene=scene,
        object_type='circle',
        position={'x': 0, 'y': 0},
        dimensions={'radius': 25}
    )
    obj2 = PhysicsObjectFactory(
        scene=scene,
        object_type='circle',
        position={'x': 40, 'y': 0},  # Partially overlapping
        dimensions={'radius': 25}
    )

    collision = detector.detect_collision(obj1, obj2)
    assert collision is not None
    assert collision['overlap'] > 0
    assert collision['normal']['x'] > 0  # Points from obj1 to obj2

def test_force_generation(scene):
    """Test force generation and application."""
    generator = ForceGenerator()

    # Create an object
    obj = PhysicsObjectFactory(
        scene=scene,
        mass=1.0,
        position={'x': 0, 'y': 0},
        velocity={'x': 0, 'y': 0}
    )

    # Apply a force
    force = {'x': 10, 'y': 0}  # 10N in x direction
    generator.apply_force(obj, force)

    # Verify acceleration (F = ma)
    assert obj.acceleration['x'] == force['x'] / obj.mass
    assert obj.acceleration['y'] == force['y'] / obj.mass

def test_constraint_solving(scene):
    """Test constraint solving."""
    engine = PhysicsEngine(scene)

    # Create two objects connected by a distance constraint
    obj1 = PhysicsObjectFactory(
        scene=scene,
        position={'x': 0, 'y': 0},
        is_static=True
    )
    obj2 = PhysicsObjectFactory(
        scene=scene,
        position={'x': 100, 'y': 0}
    )
    constraint = PhysicsConstraintFactory(
        scene=scene,
        object_a=obj1,
        object_b=obj2,
        constraint_type='distance',
        properties={'rest_length': 50}  # Should pull objects closer
    )

    # Run simulation step
    engine.step(1/60)

    # Verify constraint is being enforced
    distance = math.sqrt(
        (obj2.position['x'] - obj1.position['x'])**2 +
        (obj2.position['y'] - obj1.position['y'])**2
    )
    assert abs(distance - 50) < 1  # Should be close to rest length

def test_continuous_collision_detection(scene):
    """Test continuous collision detection."""
    detector = CollisionDetector()

    # Create fast-moving object and static obstacle
    moving = PhysicsObjectFactory(
        scene=scene,
        object_type='circle',
        position={'x': 0, 'y': 0},
        velocity={'x': 1000, 'y': 0},  # Very fast
        dimensions={'radius': 10}
    )
    static = PhysicsObjectFactory(
        scene=scene,
        object_type='circle',
        position={'x': 100, 'y': 0},
        dimensions={'radius': 10},
        is_static=True
    )

    # Check for collision in sweep
    collision = detector.sweep_test(moving, static, 1/60)
    assert collision is not None
    assert 0 <= collision['time'] <= 1/60

def test_compound_shapes(client, scene, auth_headers):
    """Test compound shape physics objects."""
    response = client.post(f'/api/scenes/{scene.id}/physics-objects',
        json={
            'name': 'Compound',
            'object_type': 'compound',
            'position': {'x': 0, 'y': 0},
            'shapes': [
                {
                    'type': 'circle',
                    'offset': {'x': 0, 'y': 0},
                    'dimensions': {'radius': 25}
                },
                {
                    'type': 'rectangle',
                    'offset': {'x': 50, 'y': 0},
                    'dimensions': {'width': 50, 'height': 25}
                }
            ],
            'mass': 2.0
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['object_type'] == 'compound'
    assert len(response.json['shapes']) == 2

def test_physics_serialization(scene):
    """Test physics state serialization."""
    engine = PhysicsEngine(scene)

    # Create some objects and constraints
    obj1 = PhysicsObjectFactory(scene=scene)
    obj2 = PhysicsObjectFactory(scene=scene)
    constraint = PhysicsConstraintFactory(
        scene=scene,
        object_a=obj1,
        object_b=obj2
    )

    # Get serialized state
    state = engine.serialize_state()
    assert 'objects' in state
    assert 'constraints' in state
    assert len(state['objects']) == 2
    assert len(state['constraints']) == 1

def test_physics_deserialization(scene):
    """Test physics state deserialization."""
    engine = PhysicsEngine(scene)

    # Create a state to deserialize
    state = {
        'objects': [
            {
                'id': 1,
                'position': {'x': 0, 'y': 100},
                'velocity': {'x': 1, 'y': 0},
                'angle': 0
            }
        ],
        'constraints': []
    }

    # Create object to receive state
    obj = PhysicsObjectFactory(scene=scene)

    # Apply state
    engine.deserialize_state(state)
    assert obj.position['x'] == 0
    assert obj.position['y'] == 100
    assert obj.velocity['x'] == 1

def test_physics_interpolation(scene):
    """Test physics state interpolation."""
    engine = PhysicsEngine(scene)

    # Create object
    obj = PhysicsObjectFactory(
        scene=scene,
        position={'x': 0, 'y': 0},
        velocity={'x': 100, 'y': 0}  # Moving right
    )

    # Get two states
    engine.step(1/60)  # State after one frame
    state1 = engine.serialize_state()
    engine.step(1/60)  # State after two frames
    state2 = engine.serialize_state()

    # Interpolate halfway
    interpolated = engine.interpolate_states(state1, state2, 0.5)
    assert len(interpolated['objects']) == 1
    obj_state = interpolated['objects'][0]
    assert state1['objects'][0]['position']['x'] < obj_state['position']['x'] < state2['objects'][0]['position']['x']
