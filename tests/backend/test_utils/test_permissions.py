import pytest
from flask import jsonify
from app.utils.permissions import (
    permission_required,
    universe_permission_required,
    has_permission,
    has_universe_permission
)
from app.models.user import User
from app.models.universe import Universe
from flask_jwt_extended import create_access_token

def test_has_permission_admin(app, test_user):
    """Test permission checking for admin users"""
    with app.app_context():
        # Make test user an admin
        test_user.is_admin = True

        # Admin should have all permissions
        assert has_permission(test_user, 'create_universe') is True
        assert has_permission(test_user, 'delete_universe') is True
        assert has_permission(test_user, 'manage_users') is True
        assert has_permission(test_user, 'view_analytics') is True
        assert has_permission(test_user, 'non_existent_permission') is True

def test_has_permission_regular_user(app, test_user):
    """Test permission checking for regular users"""
    with app.app_context():
        # Regular user permissions
        test_user.is_admin = False
        test_user.is_active = True

        # Test standard permissions
        assert has_permission(test_user, 'create_universe') is True  # All users can create
        assert has_permission(test_user, 'delete_universe') is True  # Active users can delete
        assert has_permission(test_user, 'manage_users') is False  # Only admins
        assert has_permission(test_user, 'view_analytics') is False  # Only admins

def test_has_permission_inactive_user(app, test_user):
    """Test permission checking for inactive users"""
    with app.app_context():
        test_user.is_admin = False
        test_user.is_active = False

        # Inactive users should have limited permissions
        assert has_permission(test_user, 'create_universe') is True  # Still allowed
        assert has_permission(test_user, 'delete_universe') is False  # Not allowed when inactive
        assert has_permission(test_user, 'manage_users') is False
        assert has_permission(test_user, 'view_analytics') is False

def test_has_universe_permission_owner(app, test_user):
    """Test universe permissions for universe owner"""
    with app.app_context():
        universe = Universe(
            name="Test Universe",
            creator_id=test_user.id,
            is_public=False
        )
        universe.owner_id = test_user.id

        # Owner should have all permissions
        assert has_universe_permission(test_user.id, universe.id, 'view') is True
        assert has_universe_permission(test_user.id, universe.id, 'edit') is True
        assert has_universe_permission(test_user.id, universe.id, 'manage') is True

def test_has_universe_permission_public(app, test_user):
    """Test universe permissions for public universes"""
    with app.app_context():
        # Create another user
        other_user = User(
            username="other_user",
            email="other@example.com"
        )
        other_user.set_password("password123")

        # Create public universe
        universe = Universe(
            name="Public Universe",
            creator_id=test_user.id,
            is_public=True
        )

        # Anyone should be able to view public universe
        assert has_universe_permission(other_user.id, universe.id, 'view') is True
        # But not edit or manage
        assert has_universe_permission(other_user.id, universe.id, 'edit') is False
        assert has_universe_permission(other_user.id, universe.id, 'manage') is False

def test_has_universe_permission_collaborator(app, test_user):
    """Test universe permissions for collaborators"""
    with app.app_context():
        universe = Universe(
            name="Collaborative Universe",
            creator_id=test_user.id,
            is_public=False
        )

        # Create collaborator
        collaborator = User(
            username="collaborator",
            email="collaborator@example.com"
        )
        collaborator.set_password("password123")

        # Add as editor
        universe.collaborators.append(collaborator)
        collaborator_role = next(c for c in universe.collaborators if c.user_id == collaborator.id)
        collaborator_role.role = 'editor'

        # Test editor permissions
        assert has_universe_permission(collaborator.id, universe.id, 'view') is True
        assert has_universe_permission(collaborator.id, universe.id, 'edit') is True
        assert has_universe_permission(collaborator.id, universe.id, 'comment') is True
        assert has_universe_permission(collaborator.id, universe.id, 'manage') is False

def test_permission_required_decorator(app, test_user):
    """Test permission_required decorator"""
    with app.app_context():
        # Create test endpoint with permission requirement
        @app.route('/test_permission')
        @permission_required('create_universe')
        def protected_endpoint():
            return jsonify({'message': 'success'})

        # Create test client
        client = app.test_client()

        # Test without authentication
        response = client.get('/test_permission')
        assert response.status_code == 401

        # Test with authentication but without required permission
        test_user.is_admin = False
        access_token = create_access_token(identity=test_user.id)
        headers = {'Authorization': f'Bearer {access_token}'}

        response = client.get('/test_permission', headers=headers)
        assert response.status_code == 200  # Should succeed as create_universe is allowed for all

        # Test with admin permission
        test_user.is_admin = True
        access_token = create_access_token(identity=test_user.id)
        headers = {'Authorization': f'Bearer {access_token}'}

        response = client.get('/test_permission', headers=headers)
        assert response.status_code == 200

def test_universe_permission_required_decorator(app, test_user):
    """Test universe_permission_required decorator"""
    with app.app_context():
        universe = Universe(
            name="Test Universe",
            creator_id=test_user.id,
            is_public=False
        )

        # Create test endpoint with universe permission requirement
        @app.route('/test_universe_permission/<int:universe_id>')
        @universe_permission_required('view')
        def protected_endpoint(universe_id):
            return jsonify({'message': 'success'})

        # Create test client
        client = app.test_client()

        # Test without authentication
        response = client.get(f'/test_universe_permission/{universe.id}')
        assert response.status_code == 401

        # Test with authentication but non-existent universe
        access_token = create_access_token(identity=test_user.id)
        headers = {'Authorization': f'Bearer {access_token}'}

        response = client.get('/test_universe_permission/999', headers=headers)
        assert response.status_code == 404

        # Test with proper permissions
        response = client.get(f'/test_universe_permission/{universe.id}', headers=headers)
        assert response.status_code == 200
