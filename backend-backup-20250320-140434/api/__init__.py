"""API package initialization."""

from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import routes after creating blueprints to avoid circular imports
from .routes import register_routes  # noqa

# Register routes with blueprints
register_routes(auth_bp, api_bp)

# Export blueprints
__all__ = ['auth_bp', 'api_bp']
