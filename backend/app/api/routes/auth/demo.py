from flask import request, jsonify, current_app
from flask_jwt_extended import create_access_token
from ...models.user import User
from ....extensions import db

from . import auth_bp

@auth_bp.route('/demo-login', methods=['GET', 'POST'])
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
            
            # Create response with cookies
            response = jsonify(response_data)
            
            # Set cookie for token
            is_production = current_app.config.get('ENV') == 'production'
            cookie_domain = None  # Let browser set domain automatically
            same_site = 'None' if is_production else 'Lax'
            secure = is_production
            
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
                domain=cookie_domain
            )
            
            return response, 200
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