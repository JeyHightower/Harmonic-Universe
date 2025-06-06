from flask import request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from ...models.user import User
from ....extensions import db

from . import auth_bp

@auth_bp.route('/demo-login/', methods=['GET', 'POST'])
def demo_login():
    """Login as a demo user."""
    try:
        current_app.logger.info('Starting demo login process')
        current_app.logger.info(f'Request method: {request.method}')
        current_app.logger.info(f'Request headers: {dict(request.headers)}')
        current_app.logger.info(f'Request origin: {request.headers.get("Origin")}')

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
                demo_user.set_password('Demo123!@#')
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

        # Create access and refresh tokens
        # Ensure user ID is converted to string for consistent behavior
        access_token = create_access_token(identity=str(demo_user.id))
        refresh_token = create_refresh_token(identity=str(demo_user.id))

        # Return tokens
        current_app.logger.info('Demo login successful')

        # Create response
        response = jsonify({
            'success': True,
            'message': 'Demo login successful',
            'token': access_token,
            'refresh_token': refresh_token,
            'user': demo_user.to_dict()
        })

        # Set token cookie
        is_production = current_app.config.get('ENV') == 'production'
        cookie_domain = None  # Let browser set domain automatically
        same_site = 'None'  # Use None to enable cross-site cookies for both prod and dev
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
            domain=cookie_domain,
            path='/'  # Ensure cookie is available for all paths
        )

        return response, 200

    except Exception as e:
        current_app.logger.error(f'Demo login error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'An error occurred during demo login',
            'error': str(e)
        }), 500
