"""Tests for universe routes."""
import pytest
from flask import url_for
from app.models import Universe, User
from sqlalchemy import select
from app.extensions import db

def test_create_universe(client, auth_headers):
    """Test creating a new universe."""
    data = {
        'name': 'Test Universe',
        'description': 'A test universe',
        'is_public': True,
        'max_participants': 5
    }

    response = client.post('/api/universes', json=data, headers=auth_headers)
    assert response.status_code == 201

    # Verify response data
    json_data = response.get_json()
    assert json_data['name'] == data['name']
    assert json_data['description'] == data['description']
    assert json_data['is_public'] == data['is_public']
    assert json_data['max_participants'] == data['max_participants']

def test_delete_universe(client, auth_headers, test_universe, test_user):
    """Test deleting a universe."""
    response = client.delete(f'/api/universes/{test_universe.id}', headers=auth_headers)
    assert response.status_code == 204

    # Verify universe is deleted using SQLAlchemy 2.0 pattern
    stmt = select(Universe).filter_by(id=test_universe.id)
    deleted_universe = db.session.execute(stmt).scalar_one_or_none()
    assert deleted_universe is None

def test_update_universe(client, auth_headers, test_universe, test_user):
    """Test updating a universe."""
    data = {
        'name': 'Updated Universe',
        'description': 'Updated description',
        'is_public': False,
        'max_participants': 10
    }

    response = client.put(f'/api/universes/{test_universe.id}', json=data, headers=auth_headers)
    assert response.status_code == 200

    # Verify response data
    json_data = response.get_json()
    assert json_data['name'] == data['name']
    assert json_data['description'] == data['description']
    assert json_data['is_public'] == data['is_public']
    assert json_data['max_participants'] == data['max_participants']

def test_get_universe(client, auth_headers, test_universe, test_user):
    """Test getting a specific universe."""
    response = client.get(f'/api/universes/{test_universe.id}', headers=auth_headers)
    assert response.status_code == 200

    # Verify response data
    json_data = response.get_json()
    assert json_data['name'] == test_universe.name
    assert json_data['description'] == test_universe.description
    assert json_data['is_public'] == test_universe.is_public

def test_get_universes(client, auth_headers, test_universe, test_user, session):
    """Test getting all accessible universes."""
    # Create an additional test universe
    universe2 = Universe(
        name='Universe 2',
        description='Another test universe',
        user_id=test_user.id,
        is_public=True
    )
    session.add(universe2)
    session.commit()

    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 200

    # Verify response data
    json_data = response.get_json()
    assert len(json_data['universes']) >= 2
    universe_names = [u['name'] for u in json_data['universes']]
    assert test_universe.name in universe_names
    assert 'Universe 2' in universe_names

def test_add_collaborator(client, auth_headers, test_universe, test_user, session):
    """Test adding a collaborator to a universe."""
    # Create a collaborator user
    collaborator = User(
        username='collaborator',
        email='collab@example.com'
    )
    collaborator.set_password('password123')
    session.add(collaborator)
    session.commit()

    data = {'email': collaborator.email}
    response = client.post(f'/api/universes/{test_universe.id}/collaborators',
                         json=data, headers=auth_headers)
    assert response.status_code == 201

    # Verify collaborator was added using SQLAlchemy 2.0 pattern
    stmt = select(Universe).filter_by(id=test_universe.id)
    updated_universe = db.session.execute(stmt).unique().scalar_one_or_none()
    assert collaborator in updated_universe.collaborators

def test_remove_collaborator(client, auth_headers, test_universe, test_user, session):
    """Test removing a collaborator from a universe."""
    # Create and add a collaborator
    collaborator = User(
        username='collaborator',
        email='collab@example.com'
    )
    collaborator.set_password('password123')
    session.add(collaborator)
    test_universe.collaborators.append(collaborator)
    session.commit()

    response = client.delete(
        f'/api/universes/{test_universe.id}/collaborators/{collaborator.id}',
        headers=auth_headers
    )
    assert response.status_code == 204

    # Verify collaborator was removed using SQLAlchemy 2.0 pattern
    stmt = select(Universe).filter_by(id=test_universe.id)
    updated_universe = db.session.execute(stmt).unique().scalar_one_or_none()
    assert collaborator not in updated_universe.collaborators
