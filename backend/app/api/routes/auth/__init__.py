from flask import Blueprint

# Create blueprint
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Import route modules (after blueprint creation to avoid circular imports)
from . import routes, token

# Register token blueprint with auth blueprint
auth_bp.register_blueprint(token.token_bp, url_prefix='/token')

# Import route modules
from .signup import *
from .login import *
from .logout import *
from .demo import *
from .token import *
from .debug import *
from .login import login

# All routes are already registered with auth_bp in their respective modules 

# Function to ensure JWT secret key is consistent
def configure_jwt_secret_key(app):
    """Ensure JWT secret key is properly configured.
    Call this function after app creation to standardize the JWT secret key.
    """
    import os
    
    # Use the JWT_SECRET_KEY from config instead of hardcoding
    jwt_secret_key = app.config.get('JWT_SECRET_KEY')
    if not jwt_secret_key:
        jwt_secret_key = os.environ.get('JWT_SECRET_KEY', 'jwt-secure-key-please-change-in-production-1234567890')
        # Update the config with this key
        app.config['JWT_SECRET_KEY'] = jwt_secret_key
    
    app.logger.info(f"JWT secret key configured for consistent token validation")
    
    return app 