from flask import jsonify, request, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies
from flask_cors import cross_origin
from ...models.user import User
from ....extensions import db
import uuid

from . import auth_bp

@auth_bp.route('/demo-login/', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def demo_login():
    """Login as demo user."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return current_app.make_default_options_response()

    try:
        # Use a single, persistent demo user account
        demo_email = "demo@example.com"
        demo_username = "Demo User"

        # Check if demo user already exists
        demo_user = User.query.filter_by(email=demo_email).first()

        if not demo_user:
            # Create demo user if doesn't exist
            demo_user = User(
                username=demo_username,
                email=demo_email
            )
            demo_user.set_password('demo123')  # Simple password for demo
            # Save the user to the database
            db.session.add(demo_user)
            db.session.commit()
            current_app.logger.info(f"Created new demo user: {demo_user.id}")
        else:
            current_app.logger.info(f"Using existing demo user: {demo_user.id}")

        # Generate tokens
        access_token = create_access_token(identity=demo_user.id)
        refresh_token = create_refresh_token(identity=demo_user.id)

        # Create response
        response = jsonify({
            'message': 'Demo login successful',
            'user': {
                'id': demo_user.id,
                'username': demo_user.username,
                'email': demo_user.email
            },
            'token': access_token,
            'refresh_token': refresh_token
        })

        # Set cookies
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in demo login: {str(e)}")
        return jsonify({
            'message': 'Error during demo login',
            'error': str(e)
        }), 500
