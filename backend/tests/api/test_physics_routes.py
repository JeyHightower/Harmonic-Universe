"""Tests for physics routes."""
import json
import pytest
from datetime import datetime
from app.models import PhysicsObject, PhysicsConstraint, Scene, Storyboard, Universe, User
from app.extensions import db

def test_create_physics_object(client, auth, test_scene):
    """Test creating a physics object."""
    auth.login()

    response = client.post(f'/api/scenes/{test_scene.id}/physics/objects', json={
        'name': 'Test Object',
        'object_type': 'circle',
        'mass': 1.0,
        'position': {'x': 100, 'y': 100},
        'dimensions': {'radius': 25}
    })

    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Object'
    assert data['object_type'] == 'circle'
    assert data['position'] == {'x': 100, 'y': 100}
    assert data['dimensions'] == {'radius': 25}

def test_get_physics_object(client, auth, test_scene):
    """Test getting a physics object."""
    auth.login()

    # Create test physics object
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name='Test Object',
        object_type='circle',
        mass=1.0,
        position={'x': 100, 'y': 100},
        dimensions={'radius': 25}
    )
    db.session.add(physics_object)
    db.session.commit()

    response = client.get(f'/api/scenes/{test_scene.id}/physics/objects/{physics_object.id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Test Object'
    assert data['object_type'] == 'circle'

def test_update_physics_object(client, auth, test_scene):
    """Test updating a physics object."""
    auth.login()

    # Create test physics object
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name='Test Object',
        object_type='circle',
        mass=1.0,
        position={'x': 100, 'y': 100},
        dimensions={'radius': 25}
    )
    db.session.add(physics_object)
    db.session.commit()

    response = client.put(
        f'/api/scenes/{test_scene.id}/physics/objects/{physics_object.id}',
        json={
            'name': 'Updated Object',
            'position': {'x': 200, 'y': 200}
        }
    )

    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Updated Object'
    assert data['position'] == {'x': 200, 'y': 200}

def test_delete_physics_object(client, auth, test_scene):
    """Test deleting a physics object."""
    auth.login()

    # Create test physics object
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name='Test Object',
        object_type='circle',
        mass=1.0,
        position={'x': 100, 'y': 100},
        dimensions={'radius': 25}
    )
    db.session.add(physics_object)
    db.session.commit()

    response = client.delete(f'/api/scenes/{test_scene.id}/physics/objects/{physics_object.id}')
    assert response.status_code == 204

    # Verify object is deleted
    assert PhysicsObject.query.get(physics_object.id) is None

def test_create_physics_constraint(client, auth, test_scene):
    """Test creating a physics constraint."""
    auth.login()

    # Create test physics objects
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name='Object A',
        object_type='circle',
        position={'x': 100, 'y': 100},
        dimensions={'radius': 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name='Object B',
        object_type='circle',
        position={'x': 200, 'y': 200},
        dimensions={'radius': 25}
    )
    db.session.add_all([object_a, object_b])
    db.session.commit()

    response = client.post(f'/api/scenes/{test_scene.id}/physics/constraints', json={
        'name': 'Test Constraint',
        'object_a_id': object_a.id,
        'object_b_id': object_b.id,
        'constraint_type': 'distance',
        'anchor_a': {'x': 0, 'y': 0},
        'anchor_b': {'x': 0, 'y': 0},
        'stiffness': 1.0,
        'damping': 0.7
    })

    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Constraint'
    assert data['constraint_type'] == 'distance'
    assert data['stiffness'] == 1.0
    assert data['damping'] == 0.7

def test_get_physics_constraint(client, auth, test_scene):
    """Test getting a physics constraint."""
    auth.login()

    # Create test physics objects and constraint
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name='Object A',
        object_type='circle',
        position={'x': 100, 'y': 100},
        dimensions={'radius': 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name='Object B',
        object_type='circle',
        position={'x': 200, 'y': 200},
        dimensions={'radius': 25}
    )
    db.session.add_all([object_a, object_b])
    db.session.commit()

    constraint = PhysicsConstraint(
        scene_id=test_scene.id,
        name='Test Constraint',
        object_a_id=object_a.id,
        object_b_id=object_b.id,
        constraint_type='distance',
        anchor_a={'x': 0, 'y': 0},
        anchor_b={'x': 0, 'y': 0}
    )
    db.session.add(constraint)
    db.session.commit()

    response = client.get(f'/api/scenes/{test_scene.id}/physics/constraints/{constraint.id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Test Constraint'
    assert data['constraint_type'] == 'distance'

def test_update_physics_constraint(client, auth, test_scene):
    """Test updating a physics constraint."""
    auth.login()

    # Create test physics objects and constraint
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name='Object A',
        object_type='circle',
        position={'x': 100, 'y': 100},
        dimensions={'radius': 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name='Object B',
        object_type='circle',
        position={'x': 200, 'y': 200},
        dimensions={'radius': 25}
    )
    db.session.add_all([object_a, object_b])
    db.session.commit()

    constraint = PhysicsConstraint(
        scene_id=test_scene.id,
        name='Test Constraint',
        object_a_id=object_a.id,
        object_b_id=object_b.id,
        constraint_type='distance',
        anchor_a={'x': 0, 'y': 0},
        anchor_b={'x': 0, 'y': 0}
    )
    db.session.add(constraint)
    db.session.commit()

    response = client.put(
        f'/api/scenes/{test_scene.id}/physics/constraints/{constraint.id}',
        json={
            'name': 'Updated Constraint',
            'stiffness': 2.0,
            'damping': 0.5
        }
    )

    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Updated Constraint'
    assert data['stiffness'] == 2.0
    assert data['damping'] == 0.5

def test_delete_physics_constraint(client, auth, test_scene):
    """Test deleting a physics constraint."""
    auth.login()

    # Create test physics objects and constraint
    object_a = PhysicsObject(
        scene_id=test_scene.id,
        name='Object A',
        object_type='circle',
        position={'x': 100, 'y': 100},
        dimensions={'radius': 25}
    )
    object_b = PhysicsObject(
        scene_id=test_scene.id,
        name='Object B',
        object_type='circle',
        position={'x': 200, 'y': 200},
        dimensions={'radius': 25}
    )
    db.session.add_all([object_a, object_b])
    db.session.commit()

    constraint = PhysicsConstraint(
        scene_id=test_scene.id,
        name='Test Constraint',
        object_a_id=object_a.id,
        object_b_id=object_b.id,
        constraint_type='distance',
        anchor_a={'x': 0, 'y': 0},
        anchor_b={'x': 0, 'y': 0}
    )
    db.session.add(constraint)
    db.session.commit()

    response = client.delete(f'/api/scenes/{test_scene.id}/physics/constraints/{constraint.id}')
    assert response.status_code == 204

    # Verify constraint is deleted
    assert PhysicsConstraint.query.get(constraint.id) is None

def test_simulation_controls(client, auth, test_scene):
    """Test physics simulation controls."""
    auth.login()

    # Create test physics object
    physics_object = PhysicsObject(
        scene_id=test_scene.id,
        name='Test Object',
        object_type='circle',
        mass=1.0,
        position={'x': 0, 'y': 100},
        velocity={'x': 0, 'y': 0},
        dimensions={'radius': 25}
    )
    db.session.add(physics_object)
    db.session.commit()

    # Test starting simulation
    response = client.post(f'/api/scenes/{test_scene.id}/physics/simulate/start')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'running'
    assert 'timestamp' in data

    # Test stepping simulation
    response = client.post(f'/api/scenes/{test_scene.id}/physics/simulate/step')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'objects' in data
    assert len(data['objects']) == 1
    assert data['objects'][0]['position']['y'] < 100  # Object should fall

    # Test getting simulation state
    response = client.get(f'/api/scenes/{test_scene.id}/physics/simulate/state')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'running'
    assert 'timestamp' in data
    assert 'objects' in data
    assert len(data['objects']) == 1

    # Test stopping simulation
    response = client.post(f'/api/scenes/{test_scene.id}/physics/simulate/stop')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'stopped'
    assert 'timestamp' in data

def test_unauthorized_access(client, auth, test_scene):
    """Test unauthorized access to physics endpoints."""
    # Try accessing without login
    response = client.get(f'/api/scenes/{test_scene.id}/physics/objects/1')
    assert response.status_code == 401

    # Login as different user
    auth.register('other', 'other@example.com', 'password')
    auth.login('other', 'password')

    # Try accessing another user's scene
    response = client.get(f'/api/scenes/{test_scene.id}/physics/objects/1')
    assert response.status_code == 403

def test_validation_errors(client, auth, test_scene):
    """Test validation errors in physics endpoints."""
    auth.login()

    # Test invalid object type
    response = client.post(f'/api/scenes/{test_scene.id}/physics/objects', json={
        'name': 'Invalid Object',
        'object_type': 'invalid',
        'position': {'x': 0, 'y': 0},
        'dimensions': {'radius': 25}
    })
    assert response.status_code == 400
    assert 'error' in json.loads(response.data)

    # Test invalid constraint type
    response = client.post(f'/api/scenes/{test_scene.id}/physics/constraints', json={
        'name': 'Invalid Constraint',
        'object_a_id': 1,
        'object_b_id': 2,
        'constraint_type': 'invalid',
        'anchor_a': {'x': 0, 'y': 0},
        'anchor_b': {'x': 0, 'y': 0}
    })
    assert response.status_code == 400
    assert 'error' in json.loads(response.data)

    # Test invalid physics properties
    response = client.post(f'/api/scenes/{test_scene.id}/physics/objects', json={
        'name': 'Invalid Properties',
        'object_type': 'circle',
        'mass': -1.0,  # Invalid mass
        'position': {'x': 0, 'y': 0},
        'dimensions': {'radius': 25}
    })
    assert response.status_code == 400
    assert 'error' in json.loads(response.data)
