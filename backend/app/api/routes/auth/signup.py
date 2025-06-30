from flask import request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from flask_cors import cross_origin
from ...models.user import User
from ....extensions import db
import re

from . import auth_bp

@auth_bp.route('/signup/', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def signup():
    """Register a new user."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return current_app.make_default_options_response()

    try:
        try:
            data = request.get_json()
        except Exception as e:
            current_app.logger.error(f'JSON decode error: {str(e)}')
            return jsonify({'message': 'Invalid JSON format'}), 400

        # Validate required fields
        if not data or not data.get('email') or not data.get('password') or not data.get('username'):
            return jsonify({'message': 'Email, password, and username are required'}), 400

        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'message': 'Invalid email format'}), 400

        # Validate password strength
        if len(data['password']) < 8:
            return jsonify({'message': 'Password must be at least 8 characters long'}), 400

        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email'].lower()).first()
        if existing_user:
            return jsonify({'message': 'User with this email already exists'}), 409

        # Check if username is already taken
        existing_username = User.query.filter_by(username=data['username']).first()
        if existing_username:
            return jsonify({'message': 'Username is already taken'}), 409

        # Create new user
        user = User(
            username=data['username'],
            email=data['email'].lower()
        )
        user.set_password(data['password'])

        # Save to database
        db.session.add(user)
        db.session.commit()

        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        # Create response
        response = jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': access_token,
            'refresh_token': refresh_token
        })

        # Set cookie for token
        is_production = current_app.config.get('ENV') == 'production'
        same_site = 'None'  # Use None to enable cross-site cookies
        secure = is_production or same_site == 'None'  # Must be secure if SameSite=None

        # Get token expiration time or default to 24 hours
        token_expires = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
        max_age = token_expires.total_seconds() if token_expires else 24 * 60 * 60

        response.set_cookie(
            'token',
            access_token,
            httponly=True,
            secure=secure,
            samesite=same_site,
            max_age=max_age,
            path='/'
        )

        return response, 201

    except Exception as e:
        current_app.logger.error(f'Signup error: {str(e)}')
        return jsonify({'message': 'An error occurred during registration'}), 500
