from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..models.user import User
from ..models.profile import Profile
from .. import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('register', methods=['POST'])
def register():
    """Create a new user account"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing required field: {field}"}, 400
            if not data[field]:
                return {"error": f"{field} cannot be empty"}, 400

        if User.query.filter_by(username=data['username']).first():
            return {"error": "Username already exists"}, 400

        if User.query.filter_by(email=data['email']).first():
            return {"error": "Email already exists"}, 400

        # Create user
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])

        # Add user and commit to get the user ID
        db.session.add(user)
        db.session.commit()

        # Create associated profile
        profile = Profile(
            user_id=user.id,
            bio=data.get('bio', ''),
            preferences=data.get('preferences', {})
        )
        db.session.add(profile)
        db.session.commit()

        # Generate access token
        access_token = create_access_token(identity=user.id)

        # Return user data
        return {
            "access_token": access_token,
            "username": user.username,
            "email": user.email,
            "id": user.id,
            "profile": profile.to_dict() if profile else None
        }, 201
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 422

@auth_bp.route('login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing required field: {field}"}, 400
            if not data[field]:
                return {"error": f"{field} cannot be empty"}, 400

        user = User.query.filter_by(email=data['email']).first()

        if not user:
            return {"error": "Invalid email or password"}, 401

        if not user.check_password(data['password']):
            return {"error": "Invalid email or password"}, 401

        if not user.is_active:
            return {"error": "Account is deactivated"}, 401

        # Update last login time
        user.update_last_login()

        access_token = create_access_token(identity=user.id)
        return {
            "access_token": access_token,
            "username": user.username,
            "email": user.email,
            "id": user.id
        }, 200
    except Exception as e:
        return {"error": str(e)}, 422

@auth_bp.route('user', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404
    return user.to_dict(), 200

@auth_bp.route('me', methods=['PUT'])
@jwt_required()
def update_user():
    """Update user details"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404

        data = request.get_json()

        # Check username uniqueness if being updated
        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return {'error': 'Username already exists'}, 409

        # Handle profile updates
        profile_data = {}
        if 'bio' in data:
            profile_data['bio'] = data.pop('bio')
        if 'preferences' in data:
            profile_data['preferences'] = data.pop('preferences')

        if profile_data:
            if not user.profile:
                profile = Profile(user_id=user.id)
                db.session.add(profile)
                user.profile = profile
            user.profile.update(profile_data)

        # Update user fields
        if data:
            user.update(data)

        db.session.commit()
        return user.to_dict(), 200

    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 422

@auth_bp.route('me', methods=['DELETE'])
@jwt_required()
def delete_user():
    """Delete current user account"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {"error": "User not found"}, 404

    db.session.delete(user)
    db.session.commit()
    return "", 204

@auth_bp.route('me/deactivate', methods=['POST'])
@jwt_required()
def deactivate_account():
    """Deactivate current user account"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {"error": "User not found"}, 404

    user.deactivate()
    return {"message": "Account deactivated"}, 200

@auth_bp.route('me/activate', methods=['POST'])
@jwt_required()
def activate_account():
    """Activate current user account"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {"error": "User not found"}, 404

    user.activate()
    return {"message": "Account activated"}, 200

@auth_bp.route('logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    # In a stateless JWT setup, the client just needs to remove the token
    return {"message": "Successfully logged out"}, 200
