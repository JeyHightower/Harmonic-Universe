import pytest
from app.models.universe import Universe
from app.models.user import User
from app import db
import json

pytestmark = pytest.mark.integration

@pytest.fixture
def test_user():
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_universe(test_user):
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        creator_id=test_user.id
    )
    db.session.add(universe)
    db.session.commit()
    return universe

def test_create_universe(client, test_user, auth_headers):
    """Test universe creation endpoint with validation"""
    # Test successful creation
    response = client.post('/api/universes', json={
        'name': 'New Universe',
        'description': 'A new test universe',
        'max_participants': 10,
        'is_public': True
    }, headers=auth_headers)

    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == 'New Universe'
    assert data['description'] == 'A new test universe'
    assert data['creator_id'] == test_user.id

    # Test validation failures
    # Test empty name
    response = client.post('/api/universes', json={
        'name': '',
        'description': 'Test Description'
    }, headers=auth_headers)
    assert response.status_code == 400

    # Test too long name
    response = client.post('/api/universes', json={
        'name': 'a' * 256,
        'description': 'Test Description'
    }, headers=auth_headers)
    assert response.status_code == 400

def test_get_universes(client, test_user, auth_headers):
    """Test getting list of universes with filtering"""
    # Create test universes
    universes = []
    for i in range(3):
        universe = Universe(
            name=f"Test Universe {i}",
            creator_id=test_user.id,
            description=f"Description {i}",
            is_public=True if i % 2 == 0 else False
        )
        db.session.add(universe)
        universes.append(universe)
    db.session.commit()

    # Test getting all public universes
    response = client.get("/api/universes", headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data["universes"]) == 2  # Only public universes

    # Test getting user's universes
    response = client.get("/api/universes/my", headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data["universes"]) == 3  # All user's universes

def test_get_universe_detail(client, test_universe, auth_headers):
    """Test getting a single universe details"""
    response = client.get(f'/api/universes/{test_universe.id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == test_universe.id
    assert data['name'] == test_universe.name
    assert data['description'] == test_universe.description

def test_update_universe(client, test_universe, auth_headers):
    """Test updating universe properties"""
    response = client.put(
        f'/api/universes/{test_universe.id}',
        json={
            'name': 'Updated Universe',
            'description': 'Updated description',
            'max_participants': 15,
            'is_public': False
        },
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['name'] == 'Updated Universe'
    assert data['description'] == 'Updated description'
    assert data['max_participants'] == 15
    assert data['is_public'] is False

def test_delete_universe(client, test_universe, auth_headers):
    """Test universe deletion"""
    response = client.delete(
        f'/api/universes/{test_universe.id}',
        headers=auth_headers
    )
    assert response.status_code == 204
    assert Universe.query.get(test_universe.id) is None

def test_unauthorized_operations(client, test_universe):
    """Test unauthorized access to protected endpoints"""
    # Try to update without auth
    response = client.put(
        f'/api/universes/{test_universe.id}',
        json={
            'name': 'Hacked Universe',
            'description': 'Hacked description'
        }
    )
    assert response.status_code == 401

    # Try to delete without auth
    response = client.delete(f'/api/universes/{test_universe.id}')
    assert response.status_code == 401

def test_forbidden_access(client, test_user, auth_headers):
    """Test forbidden access to other user's private universe"""
    # Create another user
    other_user = User(username="other", email="other@example.com")
    other_user.set_password("password123")
    db.session.add(other_user)
    db.session.commit()

    # Create a private universe owned by other user
    universe = Universe(
        name="Private Universe",
        creator_id=other_user.id,
        description="Private Description",
        is_public=False
    )
    db.session.add(universe)
    db.session.commit()

    # Try to access private universe
    response = client.get(
        f"/api/universes/{universe.id}",
        headers=auth_headers
    )
    assert response.status_code == 403

    # Try to update private universe
    response = client.put(
        f"/api/universes/{universe.id}",
        json={"name": "Hacked Name"},
        headers=auth_headers
    )
    assert response.status_code == 403
