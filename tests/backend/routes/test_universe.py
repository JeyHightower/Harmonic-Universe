import pytest
from flask import url_for
from http import HTTPStatus
from app.models.universe import Universe
from app.models.user import User
from app.extensions import db
from flask_jwt_extended import create_access_token
import json

@pytest.fixture(autouse=True)
def setup_database(app):
    """Set up a clean database before each test."""
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_collaborator(app):
    """Create a test collaborator."""
    with app.app_context():
        collaborator = User(
            username="collab",
            email="collab@test.com"
        )
        collaborator.set_password("password")
        db.session.add(collaborator)
        db.session.commit()
        return collaborator

@pytest.fixture
def collaborator_headers(test_collaborator):
    """Create authentication headers for the test collaborator."""
    token = create_access_token(identity=str(test_collaborator.id))
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def universe_with_collaborator(test_universe, test_collaborator):
    """Create a universe with a collaborator."""
    test_universe.collaborators.append(test_collaborator)
    db.session.commit()
    return test_universe

def test_create_universe(client, auth_headers):
    """Test universe creation."""
    data = {
        "name": "Test Universe",
        "description": "A test universe",
        "is_public": False,
        "allow_guests": False,
        "music_parameters": {"tempo": 120},
        "visual_parameters": {"color": "#FF0000"}
    }

    response = client.post(
        '/api/universe/universes',
        json=data,
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.CREATED
    json_data = response.get_json()
    assert json_data["name"] == data["name"]
    assert json_data["description"] == data["description"]
    assert json_data["is_public"] == data["is_public"]
    assert json_data["allow_guests"] == data["allow_guests"]
    assert json_data["music_parameters"] == data["music_parameters"]
    assert json_data["visual_parameters"] == data["visual_parameters"]

def test_create_universe_invalid_data(client, auth_headers):
    """Test universe creation with invalid data."""
    data = {
        "description": "Missing required name field"
    }

    response = client.post(
        '/api/universe/universes',
        json=data,
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_get_universe(client, auth_headers, test_universe):
    """Test getting a specific universe."""
    response = client.get(
        f'/api/universe/universes/{test_universe.id}',
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert json_data["id"] == str(test_universe.id)
    assert json_data["name"] == test_universe.name

def test_get_universe_not_found(client, auth_headers):
    """Test getting a non-existent universe."""
    response = client.get(
        '/api/universe/universes/99999',
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.NOT_FOUND

def test_update_universe(client, auth_headers, test_universe):
    """Test updating a universe."""
    data = {
        "name": "Updated Universe",
        "description": "Updated description",
        "is_public": True
    }

    response = client.put(
        f'/api/universe/universes/{test_universe.id}',
        json=data,
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert json_data["name"] == data["name"]
    assert json_data["description"] == data["description"]
    assert json_data["is_public"] == data["is_public"]

def test_update_universe_unauthorized(client, auth_headers, test_universe):
    """Test updating a universe without proper permissions."""
    # Create another user
    other_user = User(username="other", email="other@test.com")
    other_user.set_password("password")
    db.session.add(other_user)
    db.session.commit()

    # Get token for other user
    other_token = create_access_token(identity=str(other_user.id))
    other_headers = {"Authorization": f"Bearer {other_token}"}

    data = {"name": "Unauthorized Update"}
    response = client.put(
        f'/api/universe/universes/{test_universe.id}',
        json=data,
        headers=other_headers
    )

    assert response.status_code == HTTPStatus.FORBIDDEN

def test_delete_universe(client, auth_headers, test_universe):
    """Test deleting a universe."""
    response = client.delete(
        f'/api/universe/universes/{test_universe.id}',
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.NO_CONTENT
    assert Universe.query.get(test_universe.id) is None

def test_list_universes(client):
    """Test listing accessible universes."""
    response = client.get('/api/universe/universes')

    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert "universes" in json_data
    assert isinstance(json_data["universes"], list)

def test_update_parameters(client, auth_headers, test_universe):
    """Test updating universe parameters."""
    data = {
        "music_parameters": {"tempo": 140, "key": "C"},
        "visual_parameters": {"color": "#00FF00", "intensity": 0.8}
    }

    response = client.patch(
        f'/api/universe/universes/{test_universe.id}/parameters',
        json=data,
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert json_data["music_parameters"]["tempo"] == data["music_parameters"]["tempo"]
    assert json_data["visual_parameters"]["color"] == data["visual_parameters"]["color"]

def test_add_collaborator(client, auth_headers, test_universe, test_collaborator):
    """Test adding a collaborator to a universe."""
    data = {"email": test_collaborator.email}
    response = client.post(
        f'/api/universe/universes/{test_universe.id}/collaborators',
        json=data,
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.CREATED
    assert test_collaborator in test_universe.collaborators

def test_remove_collaborator(client, auth_headers, universe_with_collaborator, test_collaborator):
    """Test removing a collaborator from a universe."""
    response = client.delete(
        f'/api/universe/universes/{universe_with_collaborator.id}/collaborators/{test_collaborator.id}',
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.OK
    assert test_collaborator not in universe_with_collaborator.collaborators

def test_get_my_universes(client, auth_headers, test_universe):
    """Test getting universes owned by the current user."""
    response = client.get(
        '/api/universe/my',
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert "universes" in json_data
    assert len(json_data["universes"]) > 0
    assert str(test_universe.id) in [u["id"] for u in json_data["universes"]]

def test_get_owned_universes(client, auth_headers, test_universe):
    """Test getting universes owned by the current user."""
    response = client.get(
        '/api/universe/owned',
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert "universes" in json_data
    assert len(json_data["universes"]) > 0
    assert str(test_universe.id) in [u["id"] for u in json_data["universes"]]

def test_create_universe_no_auth(client):
    """Test universe creation without authentication."""
    data = {
        "name": "Test Universe",
        "description": "A test universe"
    }

    response = client.post('/api/universe/universes', json=data)
    assert response.status_code == HTTPStatus.UNAUTHORIZED

def test_create_universe_malformed_json(client, auth_headers):
    """Test universe creation with malformed JSON."""
    response = client.post(
        '/api/universe/universes',
        data="not json",
        headers=auth_headers,
        content_type='application/json'
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_get_universe_invalid_id(client, auth_headers):
    """Test getting a universe with invalid ID format."""
    response = client.get(
        '/api/universe/universes/not-an-id',
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_update_universe_no_changes(client, auth_headers, test_universe):
    """Test updating a universe with no changes."""
    data = {}
    response = client.put(
        f'/api/universe/universes/{test_universe.id}',
        json=data,
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.OK

def test_update_parameters_invalid_format(client, auth_headers, test_universe):
    """Test updating universe parameters with invalid format."""
    data = {
        "music_parameters": "not a dict",
        "visual_parameters": ["not", "a", "dict"]
    }

    response = client.patch(
        f'/api/universe/universes/{test_universe.id}/parameters',
        json=data,
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_add_collaborator_self(client, auth_headers, test_universe, test_user):
    """Test adding self as collaborator."""
    data = {"email": test_user.email}
    response = client.post(
        f'/api/universe/universes/{test_universe.id}/collaborators',
        json=data,
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_add_collaborator_duplicate(client, auth_headers, universe_with_collaborator, test_collaborator):
    """Test adding the same collaborator twice."""
    data = {"email": test_collaborator.email}
    response = client.post(
        f'/api/universe/universes/{universe_with_collaborator.id}/collaborators',
        json=data,
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_remove_collaborator_not_found(client, auth_headers, test_universe):
    """Test removing a non-existent collaborator."""
    response = client.delete(
        f'/api/universe/universes/{test_universe.id}/collaborators/99999',
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.NOT_FOUND

def test_remove_collaborator_invalid_id(client, auth_headers, test_universe):
    """Test removing a collaborator with invalid ID format."""
    response = client.delete(
        f'/api/universe/universes/{test_universe.id}/collaborators/not-an-id',
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_get_collaborators_empty(client, auth_headers, test_universe):
    """Test getting collaborators for a universe with no collaborators."""
    response = client.get(
        f'/api/universe/universes/{test_universe.id}/collaborators',
        headers=auth_headers
    )
    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert json_data["collaborators"] == []

def test_access_private_universe_unauthorized(client, test_universe):
    """Test accessing a private universe without authorization."""
    test_universe.is_public = False
    db.session.commit()

    response = client.get(f'/api/universe/universes/{test_universe.id}')
    assert response.status_code == HTTPStatus.FORBIDDEN

def test_access_private_universe_as_collaborator(client, universe_with_collaborator, collaborator_headers):
    """Test accessing a private universe as a collaborator."""
    universe_with_collaborator.is_public = False
    db.session.commit()

    response = client.get(
        f'/api/universe/universes/{universe_with_collaborator.id}',
        headers=collaborator_headers
    )
    assert response.status_code == HTTPStatus.OK

def test_list_universes_with_filters(client, test_universe):
    """Test listing universes with various filters."""
    # Make the universe public
    test_universe.is_public = True
    db.session.commit()

    # Test public universes
    response = client.get('/api/universe/universes?public=true')
    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert len(json_data["universes"]) > 0

    # Test with invalid filter
    response = client.get('/api/universe/universes?invalid=true')
    assert response.status_code == HTTPStatus.BAD_REQUEST

def test_get_collaborators(client, auth_headers, universe_with_collaborator, test_collaborator):
    """Test getting collaborators for a universe."""
    response = client.get(
        f'/api/universe/universes/{universe_with_collaborator.id}/collaborators',
        headers=auth_headers
    )

    assert response.status_code == HTTPStatus.OK
    json_data = response.get_json()
    assert len(json_data["collaborators"]) == 1
    assert json_data["collaborators"][0]["email"] == test_collaborator.email

def test_concurrent_collaborator_updates(client, auth_headers, test_universe, test_collaborator, app):
    """Test handling concurrent collaborator updates."""
    # First transaction: Add collaborator
    with app.app_context():
        data = {"email": test_collaborator.email}
        response1 = client.post(
            f'/api/universe/universes/{test_universe.id}/collaborators',
            json=data,
            headers=auth_headers
        )
        assert response1.status_code == HTTPStatus.CREATED

        # Second transaction: Try to add same collaborator again (simulating concurrent request)
        response2 = client.post(
            f'/api/universe/universes/{test_universe.id}/collaborators',
            json=data,
            headers=auth_headers
        )
        assert response2.status_code == HTTPStatus.BAD_REQUEST

        # Verify final state
        universe = Universe.query.get(test_universe.id)
        assert len(universe.collaborators) == 1
        assert test_collaborator in universe.collaborators

def test_transaction_rollback_on_error(client, auth_headers, test_universe, app):
    """Test transaction rollback on error."""
    original_name = test_universe.name

    with app.app_context():
        # Attempt to update with invalid data that should trigger a rollback
        data = {
            "name": "New Name",
            "music_parameters": {"invalid": object()}  # This will fail JSON serialization
        }

        response = client.put(
            f'/api/universe/universes/{test_universe.id}',
            json=data,
            headers=auth_headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST

        # Verify the universe was not changed
        universe = Universe.query.get(test_universe.id)
        assert universe.name == original_name

def test_concurrent_parameter_updates(client, auth_headers, test_universe, app):
    """Test handling concurrent parameter updates."""
    with app.app_context():
        # First update
        data1 = {
            "music_parameters": {"tempo": 120}
        }
        response1 = client.patch(
            f'/api/universe/universes/{test_universe.id}/parameters',
            json=data1,
            headers=auth_headers
        )
        assert response1.status_code == HTTPStatus.OK

        # Second update (simulating concurrent request)
        data2 = {
            "music_parameters": {"key": "C"}
        }
        response2 = client.patch(
            f'/api/universe/universes/{test_universe.id}/parameters',
            json=data2,
            headers=auth_headers
        )
        assert response2.status_code == HTTPStatus.OK

        # Verify final state combines both updates
        universe = Universe.query.get(test_universe.id)
        assert universe.music_parameters["tempo"] == 120
        assert universe.music_parameters["key"] == "C"

def test_collaborator_count_consistency(client, auth_headers, test_universe, test_collaborator, app):
    """Test collaborator count remains consistent across operations."""
    with app.app_context():
        # Add collaborator
        data = {"email": test_collaborator.email}
        response = client.post(
            f'/api/universe/universes/{test_universe.id}/collaborators',
            json=data,
            headers=auth_headers
        )
        assert response.status_code == HTTPStatus.CREATED

        # Verify count
        universe = Universe.query.get(test_universe.id)
        assert universe.collaborators_count == 1
        assert len(universe.collaborators) == 1

        # Remove collaborator
        response = client.delete(
            f'/api/universe/universes/{test_universe.id}/collaborators/{test_collaborator.id}',
            headers=auth_headers
        )
        assert response.status_code == HTTPStatus.OK

        # Verify count is updated
        universe = Universe.query.get(test_universe.id)
        assert universe.collaborators_count == 0
        assert len(universe.collaborators) == 0

