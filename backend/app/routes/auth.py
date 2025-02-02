"""
Authentication routes.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from app.db import db
from app.models.user import User
from app.schemas.user import user_schema, user_create_schema, user_login_schema
from app.schemas.token import token_schema
import uuid

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        # Validate request data
        data = user_create_schema.load(request.json)

        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Create new user
        user = User(
            email=data['email'],
            password=data['password'],
            full_name=data['full_name']
        )
        db.session.add(user)
        db.session.commit()

        # Create access token
        access_token = create_access_token(identity=str(user.id))

        # Return response
        return jsonify({
            'user': user_schema.dump(user),
            'token': token_schema.dump({
                'access_token': access_token,
                'token_type': 'bearer'
            })
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user."""
    try:
        # Validate request data
        data = user_login_schema.load(request.json)

        # Check user credentials
        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.verify_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Create access token
        access_token = create_access_token(identity=str(user.id))

        # Return response
        return jsonify({
            'user': user_schema.dump(user),
            'token': token_schema.dump({
                'access_token': access_token,
                'token_type': 'bearer'
            })
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Get current user."""
    try:
        # Get current user
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Return response
        return jsonify(user_schema.dump(user)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_user():
    """Update user details."""
    try:
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.json
        if 'email' in data:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already registered'}), 400
            user.email = data['email']
        if 'full_name' in data:
            user.full_name = data['full_name']

        db.session.commit()
        return jsonify(user_schema.dump(user)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_user():
    """Delete current user account."""
    try:
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        db.session.delete(user)
        db.session.commit()
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/deactivate', methods=['POST'])
@jwt_required()
def deactivate_account():
    """Deactivate current user account."""
    try:
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.is_active = False
        db.session.commit()
        return jsonify({'message': 'Account deactivated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/activate', methods=['POST'])
@jwt_required()
def activate_account():
    """Activate current user account."""
    try:
        user_id = uuid.UUID(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.is_active = True
        db.session.commit()
        return jsonify({'message': 'Account activated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user."""
    return jsonify({'message': 'Successfully logged out'}), 200
