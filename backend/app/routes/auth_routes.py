# app/routes/auth_routes.py
from flask import Blueprint, request, jsonify, session
from app.models import db
from app.models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength
    - At least 8 characters
    - Contains at least one digit
    - Contains at least one uppercase letter
    """
    if len(password) < 8:
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    return True

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()

        # Check if all required fields are present
        required_fields = ['username', 'email', 'password']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields',
                'required_fields': required_fields
            }), 400

        # Validate email format
        if not validate_email(data['email']):
            return jsonify({
                'error': 'Invalid email format'
            }), 400

        # Validate password strength
        if not validate_password(data['password']):
            return jsonify({
                'error': 'Password must be at least 8 characters long and contain at least one digit and one uppercase letter'
            }), 400

        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'error': 'Username already exists'
            }), 409

        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'error': 'Email already registered'
            }), 409

        # Create new user
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        new_user = User(
            username=data['username'],
            email=data['email'],
            password_hash=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'An error occurred while creating the user',
            'details': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        # Check if all required fields are present
        if not all(field in data for field in ['email', 'password']):
            return jsonify({
                'error': 'Missing email or password'
            }), 400

        # Find user by email
        user = User.query.filter_by(email=data['email']).first()

        if user and check_password_hash(user.password_hash, data['password']):
            # Create session
            session.clear()
            session['user_id'] = user.id
            session.permanent = True  # Use permanent session

            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }), 200

        return jsonify({
            'error': 'Invalid email or password'
        }), 401

    except Exception as e:
        return jsonify({
            'error': 'An error occurred during login',
            'details': str(e)
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        return jsonify({
            'message': 'Logout successful'
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'An error occurred during logout',
            'details': str(e)
        }), 500
