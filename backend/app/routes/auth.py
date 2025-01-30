from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import select
from ..models import User, Profile
from .. import db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
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

        # Check for existing username
        stmt = select(User).filter_by(username=data['username'])
        if db.session.execute(stmt).scalar_one_or_none():
            return {"error": "Username already exists"}, 400

        # Check for existing email
        stmt = select(User).filter_by(email=data['email'])
        if db.session.execute(stmt).scalar_one_or_none():
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

        # Create associated profile with only bio
        profile = Profile(
            user_id=user.id,
            bio=data.get('bio', '')
        )
        db.session.add(profile)
        db.session.commit()

        # Generate access token with string user ID
        access_token = create_access_token(identity=str(user.id))

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

@bp.route('/login', methods=['POST'])
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

        # Find user by email using select()
        stmt = select(User).filter_by(email=data['email'])
        user = db.session.execute(stmt).scalar_one_or_none()

        if not user:
            return {"error": "Invalid email or password"}, 401

        if not user.check_password(data['password']):
            return {"error": "Invalid email or password"}, 401

        if not user.is_active:
            return {"error": "Account is deactivated"}, 401

        # Update last login time
        user.update_last_login()
        db.session.commit()

        # Generate access token with string user ID
        access_token = create_access_token(identity=str(user.id))
        return {
            "access_token": access_token,
            "username": user.username,
            "email": user.email,
            "id": user.id
        }, 200
    except Exception as e:
        return {"error": str(e)}, 422

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user details"""
    try:
        current_user_id = get_jwt_identity()
        try:
            user_id = int(current_user_id)
        except (ValueError, TypeError):
            return {"error": "Invalid user ID format"}, 400

        # Use select() instead of get()
        stmt = select(User).filter_by(id=user_id)
        user = db.session.execute(stmt).scalar_one_or_none()

        if not user:
            return {"error": "User not found"}, 404

        return {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "profile": user.profile.to_dict() if user.profile else None
        }, 200
    except Exception as e:
        return {"error": str(e)}, 422

@bp.route('/me', methods=['PUT'])
@jwt_required()
def update_user():
    """Update user details"""
    try:
        current_user_id = get_jwt_identity()
        try:
            user_id = int(current_user_id)
        except (ValueError, TypeError):
            return {"error": "Invalid user ID format"}, 400

        # Use select() instead of get()
        stmt = select(User).filter_by(id=user_id)
        user = db.session.execute(stmt).scalar_one_or_none()

        if not user:
            return {'error': 'User not found'}, 404

        data = request.get_json()

        # Check username uniqueness if being updated
        if 'username' in data and data['username'] != user.username:
            stmt = select(User).filter_by(username=data['username'])
            if db.session.execute(stmt).scalar_one_or_none():
                return {'error': 'Username already exists'}, 409

        # Update user fields
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']

        # Handle profile updates
        if 'bio' in data or 'preferences' in data:
            if not user.profile:
                profile = Profile(user_id=user.id)
                db.session.add(profile)
                user.profile = profile

            if 'bio' in data:
                user.profile.bio = data['bio']
            if 'preferences' in data:
                user.profile.preferences = data['preferences']

        db.session.commit()

        return {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "profile": user.profile.to_dict() if user.profile else None
        }, 200

    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 422

@bp.route('/me', methods=['DELETE'])
@jwt_required()
def delete_user():
    """Delete current user account"""
    try:
        user_id = get_jwt_identity()
        stmt = select(User).filter_by(id=user_id)
        user = db.session.execute(stmt).scalar_one_or_none()

        if not user:
            return {"error": "User not found"}, 404

        db.session.delete(user)
        db.session.commit()
        return "", 204
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 422

@bp.route('/me/deactivate', methods=['POST'])
@jwt_required()
def deactivate_account():
    """Deactivate current user account"""
    try:
        user_id = get_jwt_identity()
        stmt = select(User).filter_by(id=user_id)
        user = db.session.execute(stmt).scalar_one_or_none()

        if not user:
            return {"error": "User not found"}, 404

        user.deactivate()
        db.session.commit()
        return {"message": "Account deactivated"}, 200
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 422

@bp.route('/me/activate', methods=['POST'])
@jwt_required()
def activate_account():
    """Activate current user account"""
    try:
        user_id = get_jwt_identity()
        stmt = select(User).filter_by(id=user_id)
        user = db.session.execute(stmt).scalar_one_or_none()

        if not user:
            return {"error": "User not found"}, 404

        user.activate()
        db.session.commit()
        return {"message": "Account activated"}, 200
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 422

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    # In a stateless JWT setup, the client just needs to remove the token
    return {"message": "Successfully logged out"}, 200
