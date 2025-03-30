from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from ..models import User
from ..models.database import db
from datetime import datetime, timedelta
import jwt
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 409
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 409
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        # Add user to session and commit
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Registration error: {str(e)}')
        return jsonify({
            'message': 'An error occurred during registration',
            'error': str(e)
        }), 500

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