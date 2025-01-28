from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..models.profile import Profile
from .. import db

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('', methods=['POST'])
@jwt_required()
def create_profile():
    """Create a profile for the current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {"error": "User not found"}, 404

    if user.profile:
        return {"error": "Profile already exists"}, 400

    try:
        data = request.get_json()
        if not data:
            return {"error": "No data provided"}, 400

        profile = Profile(
            user_id=user.id,
            bio=data.get('bio', ''),
            preferences=data.get('preferences', {})
        )

        db.session.add(profile)
        db.session.commit()

        return profile.to_dict(), 201

    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 422

@profile_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the current user's profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.profile:
        return {"error": "Profile not found"}, 404

    try:
        data = request.get_json()
        if not data:
            return {"error": "No data provided"}, 400

        profile = user.profile
        if 'bio' in data:
            profile.bio = data['bio']
        if 'preferences' in data:
            profile.preferences = data['preferences']

        db.session.commit()
        return profile.to_dict(), 200

    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 422

@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    """Get the current user's profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.profile:
        return {"error": "Profile not found"}, 404

    return user.profile.to_dict(), 200

