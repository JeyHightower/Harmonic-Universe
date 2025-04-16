from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

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
    
    # Use the default key from config.py
    # This is the value that actually works with the tokens
    app.config['JWT_SECRET_KEY'] = 'jwt-secret-key'
    app.logger.info(f"JWT secret key set to default value for consistent token validation")
    
    return app 