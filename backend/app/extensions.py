from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from datetime import datetime
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",
    storage_options={}
)

# In-memory token blocklist - in production, replace with a database or Redis
token_blocklist = set()

# Token blocklist check
@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(jwt_header, jwt_payload):
    jti = jwt_payload['jti']  # JWT ID is used for blocklisting
    return jti in token_blocklist

# Ensure user identity is consistently an integer
@jwt.user_identity_loader
def user_identity_loader(identity):
    try:
        # Convert identity to integer if possible
        return int(identity)
    except (ValueError, TypeError):
        # Return original identity if conversion fails
        return identity

# Add token to blocklist
def add_token_to_blocklist(jti):
    token_blocklist.add(jti)
    return True

# Additional JWT error handlers for improved debugging
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {
        'status': 401,
        'message': 'The token has expired',
        'error': 'token_expired'
    }, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return {
        'status': 401,
        'message': 'Signature verification failed',
        'error': 'invalid_token'
    }, 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return {
        'status': 401,
        'message': 'Request does not contain a valid token',
        'error': 'authorization_required'
    }, 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return {
        'status': 401,
        'message': 'The token has been revoked',
        'error': 'token_revoked'
    }, 401

def init_extensions(app):
    """Initialize Flask extensions with the app context."""
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    return app
