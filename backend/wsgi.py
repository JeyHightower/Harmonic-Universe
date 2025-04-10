"""
WSGI entry point for Harmonic Universe backend

This file serves as the main WSGI entry point for the Flask application
in all environments (development, testing, and production).
It uses the create_app function from app/__init__.py to initialize the application.
"""

import os
import sys
import logging
import importlib.util
from dotenv import load_dotenv

# Set up logging based on environment
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Starting Harmonic Universe application")

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load .env file from the backend directory explicitly
backend_env = os.path.join(script_dir, '.env')
if os.path.exists(backend_env):
    load_dotenv(dotenv_path=backend_env)
    logger.info(f"Loading environment from: {backend_env}")
else:
    # Fallback to root .env
    root_dir = os.path.dirname(script_dir)
    root_env = os.path.join(root_dir, '.env')
    if os.path.exists(root_env):
        load_dotenv(dotenv_path=root_env)
        logger.info(f"Loading environment from: {root_env}")
    else:
        # Last resort: default behavior
        load_dotenv()
        logger.info("Using default load_dotenv behavior")

# CRITICAL: Set the JWT key directly in environment
# This is the key that caused the issue - the env var is getting lost
jwt_key = os.environ.get('JWT_SECRET_KEY')
if jwt_key:
    # Save it back to environment to fix the issue with lost env variables
    os.environ['JWT_SECRET_KEY'] = jwt_key
    safe_key = jwt_key[:5] + '...' + jwt_key[-5:] if len(jwt_key) > 10 else "***"
    logger.info(f"Using JWT_SECRET_KEY: {safe_key}")
else:
    os.environ['JWT_SECRET_KEY'] = 'harmonic-universe-jwt-secret-key'
    logger.info("JWT_SECRET_KEY not found in environment, setting to default: harmonic-universe-jwt-secret-key")

# Check if fixes modules are available
try:
    # Check if render fixes are available
    render_fixes_spec = importlib.util.find_spec('fixes.render')
    render_fixes_available = render_fixes_spec is not None
    logger.info(f"Render fixes module available: {render_fixes_available}")
except ImportError:
    logger.warning("Could not check for render fixes module")
    render_fixes_available = False

# CRITICAL: Register a JWT key provider
# This extends Flask-JWT-Extended to ensure it gets the key from environment on every check
def _patched_jwt_get_secret_key():
    """Get the JWT secret key from environment on every access."""
    jwt_key = os.environ.get('JWT_SECRET_KEY', 'harmonic-universe-jwt-secret-key')
    logger.info(f"Using JWT secret key: {jwt_key[:5]}...")
    return jwt_key

# Import the app factory function and create the application
from app import create_app

# Apply the patch just before application creation
try:
    from flask_jwt_extended.config import config as jwt_config
    jwt_config._user_get_jwt_secret_key = _patched_jwt_get_secret_key
    logger.info("Successfully patched JWT secret key provider")
except Exception as e:
    logger.error(f"Failed to patch JWT secret key provider: {e}")

# Get the environment from environment variable or use development as default
flask_env = os.environ.get('FLASK_ENV', 'development')
application = create_app(flask_env)

# This is what Gunicorn will import
app = application

# Development server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    logger.info(f"Starting development server on port {port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug) 