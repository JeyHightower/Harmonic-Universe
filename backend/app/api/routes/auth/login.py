from flask import request, jsonify, current_app
from flask_jwt_extended import create_access_token
from ...models.user import User
from ....extensions import db

from . import auth_bp

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
        
        # Create response
        response = jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': access_token
        })
        
        # Set cookie for token (in addition to JSON response)
        is_production = current_app.config.get('ENV') == 'production'
        cookie_domain = None  # Let browser set domain automatically
        same_site = 'None'  # Use None to enable cross-site cookies for both prod and dev
        secure = is_production or same_site == 'None'  # Must be secure if SameSite=None
        
        # Get token expiration time or default to 24 hours
        token_expires = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
        max_age = token_expires.total_seconds() if token_expires else 24 * 60 * 60  # 24 hours default
        
        response.set_cookie(
            'token',
            access_token,
            httponly=True,
            secure=secure,
            samesite=same_site,
            max_age=max_age,
            domain=cookie_domain,
            path='/'  # Ensure cookie is available for all paths
        )
        
        return response, 200
        
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({'message': 'An error occurred during login'}), 500 