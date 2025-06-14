from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from ..models.user import User
from ...extensions import db
from datetime import datetime, timedelta
import jwt
import os
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
@auth_bp.route('/signup/', methods=['POST'])
def signup():
    """Sign up a new user."""
    try:
        data = request.get_json()

        # Validate required fields
        if not all(key in data for key in ["username", "email", "password"]):
            return jsonify({"message": "Missing required fields"}), 400

        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Username validation
        if not username:
            return jsonify({"message": "Username is required"}), 400
        if not (3 <= len(username) <= 30):
            return jsonify({"message": "Username must be between 3 and 30 characters"}), 400
        if not username[0].isalpha():
            return jsonify({"message": "Username must start with a letter"}), 400
        if not all(c.isalnum() or c in "_-" for c in username):
            return jsonify({"message": "Username can only contain letters, numbers, underscores, and hyphens"}), 400

        # Email validation
        if not email:
            return jsonify({"message": "Email is required"}), 400
        if len(email) > 254:
            return jsonify({"message": "Email address is too long"}), 400
        if not re.match(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", email):
            return jsonify({"message": "Please enter a valid email address"}), 400

        # Password validation
        if not password:
            return jsonify({"message": "Password is required"}), 400
        if len(password) < 8:
            return jsonify({"message": "Password must be at least 8 characters long"}), 400
        if len(password) > 128:
            return jsonify({"message": "Password is too long"}), 400
        if not re.search(r"[A-Z]", password):
            return jsonify({"message": "Password must contain at least one uppercase letter"}), 400
        if not re.search(r"[a-z]", password):
            return jsonify({"message": "Password must contain at least one lowercase letter"}), 400
        if not re.search(r"\d", password):
            return jsonify({"message": "Password must contain at least one number"}), 400
        if not re.search(r"[@$!%*?&]", password):
            return jsonify({"message": "Password must contain at least one special character (@$!%*?&)"}), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 409
        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username already exists"}), 409

        # Create new user
        new_user = User(
            username=username,
            email=email.lower(),
        )
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        # Generate token
        token = create_access_token(identity=new_user.id)

        return jsonify({
            "message": "User signed up successfully",
            "token": token,
            "user": new_user.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"message": "An error occurred during signup"}), 500

@auth_bp.route('/login', methods=['POST'])
@auth_bp.route('/login/', methods=['POST'])
def login():
    """Login a user."""
    try:
        try:
            data = request.get_json()
        except Exception as e:
            current_app.logger.error(f'JSON decode error: {str(e)}')
            return jsonify({'message': 'Invalid JSON format'}), 400

        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400

        # Find user by email
        user = User.query.filter_by(email=data['email'].lower()).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid email or password'}), 401

        # Generate token
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': access_token
        }), 200

    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({'message': 'An error occurred during login'}), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_bp.route('/logout/', methods=['POST'])
@jwt_required()
def logout():
    """Logout the current user."""
    try:
        # In JWT, we don't need to do anything server-side
        # The client should remove the token
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        current_app.logger.error(f'Logout error: {str(e)}')
        return jsonify({'message': 'An error occurred during logout'}), 500

# Demo login route is now in demo.py

@auth_bp.route('/validate', methods=['GET'])
@auth_bp.route('/validate/', methods=['GET'])
@jwt_required()
def validate_token():
    """Validate the JWT token and return user data."""
    try:
        # Get user ID from JWT token
        user_id = get_jwt_identity()

        # Get user from database
        user = User.query.get(user_id)

        if not user:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({
            'message': 'Token is valid',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Token validation error: {str(e)}')
        return jsonify({'message': 'An error occurred during token validation'}), 500
