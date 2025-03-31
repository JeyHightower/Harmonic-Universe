from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from ..models import User
from ..models.database import db
from datetime import datetime, timedelta
import jwt
import os
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
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
            email=email,
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate token
        token = create_access_token(identity=new_user.id)
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": new_user.to_dict(),
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({"message": "An error occurred during registration"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
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

@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    """Login as a demo user."""
    try:
        current_app.logger.info('Starting demo login process')
        
        # Check if demo user exists
        demo_user = User.query.filter_by(email='demo@example.com').first()
        current_app.logger.info(f'Demo user exists: {demo_user is not None}')
        
        if not demo_user:
            try:
                current_app.logger.info('Creating new demo user')
                # Create demo user if it doesn't exist
                demo_user = User(
                    username='demo',
                    email='demo@example.com'
                )
                demo_user.set_password('demo123')
                db.session.add(demo_user)
                db.session.commit()
                current_app.logger.info('Demo user created successfully')
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f'Error creating demo user: {str(e)}')
                current_app.logger.exception('Full traceback:')
                return jsonify({
                    'message': 'Failed to create demo user',
                    'error': str(e)
                }), 500
        
        try:
            current_app.logger.info('Generating access token')
            # Generate token
            access_token = create_access_token(identity=demo_user.id)
            
            response_data = {
                'message': 'Demo login successful',
                'user': demo_user.to_dict(),
                'token': access_token
            }
            current_app.logger.info('Demo login successful')
            return jsonify(response_data), 200
        except Exception as e:
            current_app.logger.error(f'Error generating token: {str(e)}')
            current_app.logger.exception('Full traceback:')
            return jsonify({
                'message': 'Failed to generate access token',
                'error': str(e)
            }), 500
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Demo login error: {str(e)}')
        current_app.logger.exception('Full traceback:')
        return jsonify({
            'message': 'An error occurred during demo login',
            'error': str(e)
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get the current user's information."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify({
            'user': user.to_dict()
        }), 200
    except Exception as e:
        current_app.logger.error(f'Get current user error: {str(e)}')
        return jsonify({'message': 'An error occurred while fetching user information'}), 500 