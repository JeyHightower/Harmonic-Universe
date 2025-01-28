import pytest
from flask import jsonify
from app.utils.auth import require_auth, check_universe_access
from app.models.universe import Universe
from flask_jwt_extended import create_access_token
from functools import wraps

def test_require_auth_decorator(app, test_user):
    """Test the require_auth decorator"""
    with app.app_context():
        # Create a test endpoint with the decorator
        @app.route('/test_auth')
        @require_auth
        def protected_endpoint():
            return jsonify({'message': 'success'})

        # Create test client
        client = app.test_client()

        # Test without token
        response = client.get('/test_auth')
        assert response.status_code == 401

        # Test with valid token
        access_token = create_access_token(identity=test_user.id)
        headers = {'Authorization': f'Bearer {access_token}'}
        response = client.get('/test_auth', headers=headers)
        assert response.status_code == 200
        assert response.json['message'] == 'success'

        # Test with invalid token
        headers = {'Authorization': 'Bearer invalid_token'}
        response = client.get('/test_auth', headers=headers)
        assert response.status_code == 422

def test_check_universe_access_public(app, test_user):
    """Test universe access check for public universes"""
    with app.app_context():
        # Create a public universe
        universe = Universe(
            name="Public Universe",
            creator_id=test_user.id,
            is_public=True
        )

        # Test access for creator
        assert check_universe_access(universe, test_user.id) is True

        # Test access for other user
        other_user_id = test_user.id + 1
        assert check_universe_access(universe, other_user_id) is True

        # Test access with ownership requirement
        assert check_universe_access(universe, other_user_id, require_ownership=True) is False
        assert check_universe_access(universe, test_user.id, require_ownership=True) is True

def test_check_universe_access_private(app, test_user):
    """Test universe access check for private universes"""
    with app.app_context():
        # Create a private universe
        universe = Universe(
            name="Private Universe",
            creator_id=test_user.id,
            is_public=False
        )

        # Test access for creator
        assert check_universe_access(universe, test_user.id) is True

        # Test access for other user
        other_user_id = test_user.id + 1
        assert check_universe_access(universe, other_user_id) is False

def test_check_universe_access_edge_cases(app):
    """Test universe access check edge cases"""
    with app.app_context():
        # Test with None universe
        assert check_universe_access(None, 1) is False

        # Test with None user_id
        universe = Universe(
            name="Test Universe",
            creator_id=1,
            is_public=True
        )
        assert check_universe_access(universe, None) is False

def test_require_auth_error_handling(app):
    """Test error handling in require_auth decorator"""
    with app.app_context():
        # Create a test endpoint that raises an exception
        @app.route('/test_auth_error')
        @require_auth
        def error_endpoint():
            raise Exception("Test error")

        # Create test client
        client = app.test_client()

        # Test with invalid token format
        headers = {'Authorization': 'Invalid format'}
        response = client.get('/test_auth_error', headers=headers)
        assert response.status_code == 401

        # Test with malformed token
        headers = {'Authorization': 'Bearer'}
        response = client.get('/test_auth_error', headers=headers)
        assert response.status_code == 422
