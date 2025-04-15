from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from datetime import datetime

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

# In-memory token blocklist - in production, replace with a database or Redis
token_blocklist = set()

# Token blocklist check
@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(jwt_header, jwt_payload):
    jti = jwt_payload['jti']  # JWT ID is used for blocklisting
    return jti in token_blocklist

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