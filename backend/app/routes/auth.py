"""Authentication routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app.models.user import User
from app.schemas.user import UserSchema
from app import db

auth = Blueprint('auth', __name__)
user_schema = UserSchema()

@auth.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()

    try:
        # Validate input data
        errors = user_schema.validate(data)
        if errors:
            return jsonify({'error': errors}), 400

        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400

        # Create new user
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'user': user_schema.dump(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth.route('/api/auth/login', methods=['POST'])
def login():
    """Login user and return tokens."""
    data = request.get_json()

    try:
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()

        # Verify user and password
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401

        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'user': user_schema.dump(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    try:
        current_user_id = get_jwt_identity()
        access_token = create_access_token(identity=current_user_id)
        return jsonify({'access_token': access_token})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_user():
    """Get current user details."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(user_schema.dump(user))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
