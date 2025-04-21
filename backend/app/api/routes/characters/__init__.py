from flask import Blueprint

characters_bp = Blueprint('characters', __name__, url_prefix='/api/characters')

# Import route modules
from . import list_routes
from . import detail_routes
from . import create_routes
from . import update_routes
from . import delete_routes
from . import universe_routes  # Import the new universe routes

# All routes are already registered with characters_bp in their respective modules
