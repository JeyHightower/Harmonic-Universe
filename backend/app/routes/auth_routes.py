# app/routes/auth_routes.py
from flask import Blueprint, request, jsonify, g
from app.models.user import User
from app import db
import jwt
import bcrypt
from datetime import datetime, timedelta, UTC
from app.config import Config
from app.utils.token_manager import auto_token
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def generate_token(user_id):
    """Generate a JWT token for the user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(UTC) + timedelta(days=30),
        'iat': datetime.now(UTC)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

@auth_bp.route('/token', methods=['POST'])
def get_token():
    """Get a token with email/password"""
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        token = generate_token(user.id)
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })

    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/token/refresh', methods=['POST'])
def refresh_token():
    """Get a new token using an existing valid token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401

    try:
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user = User.query.get(data['user_id'])

        if not user:
            return jsonify({'error': 'User not found'}), 404

        new_token = generate_token(user.id)
        return jsonify({
            'token': new_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@auth_bp.route('/signup', methods=['POST'])
def signup():
    print("Request received at /signup")  # Debug log
    print("Request headers:", request.headers)  # Debug log
    print("Request data:", request.get_data(as_text=True))  # Debug log

    data = request.get_json()
    print("Parsed JSON data:", data)  # Debug log

    if not data:
        print("No data provided or invalid JSON")  # Debug log
        return jsonify({'error': 'No data provided or invalid JSON', 'type': 'validation_error'}), 400

    # Check required fields
    required_fields = ['email', 'password', 'username']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        print("Missing fields:", missing_fields)  # Debug log
        return jsonify({
            'error': f'Missing required fields: {", ".join(missing_fields)}',
            'type': 'validation_error'
        }), 400

    # Clean input data
    email = data['email'].strip()
    username = data['username'].strip()
    password = data['password']
    print(f"Cleaned data - email: {email}, username: {username}, password length: {len(password)}")  # Debug log

    # Check if email already exists
    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        print("Email exists:", email)  # Debug log
        return jsonify({
            'error': 'Email already registered',
            'type': 'validation_error'
        }), 400

    # Check if username already exists
    existing_username = User.query.filter_by(username=username).first()
    if existing_username:
        print("Username exists:", username)  # Debug log
        return jsonify({
            'error': 'Username already taken',
            'type': 'validation_error'
        }), 400

    # Validate email format
    if not '@' in email or not '.' in email:
        print("Invalid email format:", email)  # Debug log
        return jsonify({
            'error': 'Invalid email format',
            'type': 'validation_error'
        }), 400

    # Validate username
    if len(username) < 3 or len(username) > 40:
        print("Invalid username length:", len(username))  # Debug log
        return jsonify({
            'error': 'Username must be between 3 and 40 characters',
            'type': 'validation_error'
        }), 400
    if not username.replace('_', '').replace('-', '').isalnum():
        print("Invalid username characters:", username)  # Debug log
        return jsonify({
            'error': 'Username can only contain letters, numbers, underscores, and hyphens',
            'type': 'validation_error'
        }), 400

    # Validate password
    if len(password) < 8:
        print("Password too short:", len(password))  # Debug log
        return jsonify({
            'error': 'Password must be at least 8 characters long',
            'type': 'validation_error'
        }), 400
    if not any(c.isupper() for c in password):
        print("Password missing uppercase")  # Debug log
        return jsonify({
            'error': 'Password must contain at least one uppercase letter',
            'type': 'validation_error'
        }), 400
    if not any(c.islower() for c in password):
        print("Password missing lowercase")  # Debug log
        return jsonify({
            'error': 'Password must contain at least one lowercase letter',
            'type': 'validation_error'
        }), 400
    if not any(c.isdigit() for c in password):
        print("Password missing number")  # Debug log
        return jsonify({
            'error': 'Password must contain at least one number',
            'type': 'validation_error'
        }), 400

    print("All validation passed")  # Debug log

    # Create new user
    try:
        new_user = User(
            username=username,
            email=email
        )
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        # Generate token for new user
        token = generate_token(new_user.id)

        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'username': new_user.username
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error creating user:", str(e))  # Debug log
        return jsonify({
            'error': 'An error occurred while creating the user',
            'type': 'server_error',
            'details': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        # Generate token
        token = generate_token(user.id)

        return jsonify({
            'message': 'Logged in successfully',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })

    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/validate', methods=['GET'])
def validate_token():
    """Validate a token and return user info"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401

    try:
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user = User.query.get(data['user_id'])

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'valid': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@auth_bp.route('/user', methods=['PUT'])
@auto_token
def update_user():
    """Update the authenticated user's information"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'type': 'validation_error'}), 400

        user = User.query.get(g.current_user.id)
        if not user:
            return jsonify({'error': 'User not found', 'type': 'not_found_error'}), 404

        # Update username if provided
        if 'username' in data:
            username = data['username'].strip()
            if not username:
                return jsonify({'error': 'Username cannot be empty', 'type': 'validation_error'}), 400
            if len(username) < 3 or len(username) > 40:
                return jsonify({'error': 'Username must be between 3 and 40 characters', 'type': 'validation_error'}), 400
            if not username.replace('_', '').replace('-', '').isalnum():
                return jsonify({'error': 'Username can only contain letters, numbers, underscores, and hyphens', 'type': 'validation_error'}), 400

            # Check if username is taken by another user
            existing_user = User.query.filter_by(username=username).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Username already taken', 'type': 'validation_error'}), 400

            user.username = username

        # Update email if provided
        if 'email' in data:
            email = data['email'].strip()
            if not email:
                return jsonify({'error': 'Email cannot be empty', 'type': 'validation_error'}), 400
            if not '@' in email or not '.' in email:
                return jsonify({'error': 'Invalid email format', 'type': 'validation_error'}), 400

            # Check if email is taken by another user
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already registered', 'type': 'validation_error'}), 400

            user.email = email

        # Update password if provided
        if 'password' in data:
            password = data['password']
            if len(password) < 8:
                return jsonify({'error': 'Password must be at least 8 characters long', 'type': 'validation_error'}), 400
            if not any(c.isupper() for c in password):
                return jsonify({'error': 'Password must contain at least one uppercase letter', 'type': 'validation_error'}), 400
            if not any(c.islower() for c in password):
                return jsonify({'error': 'Password must contain at least one lowercase letter', 'type': 'validation_error'}), 400
            if not any(c.isdigit() for c in password):
                return jsonify({'error': 'Password must contain at least one number', 'type': 'validation_error'}), 400

            user.set_password(password)

        db.session.commit()

        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'An error occurred while updating the user',
            'type': 'server_error',
            'details': str(e)
        }), 500

@auth_bp.route('/user', methods=['DELETE'])
@auto_token
def delete_user():
    """Delete the authenticated user's account"""
    try:
        user = User.query.get(g.current_user.id)
        if not user:
            return jsonify({'error': 'User not found', 'type': 'not_found_error'}), 404

        # Delete all user's universes and related data
        universes = Universe.query.filter_by(creator_id=user.id).all()
        for universe in universes:
            db.session.delete(universe)

        db.session.delete(user)
        db.session.commit()

        return jsonify({
            'message': 'User account deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'An error occurred while deleting the user',
            'type': 'server_error',
            'details': str(e)
        }), 500
