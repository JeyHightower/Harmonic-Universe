from flask import Blueprint

characters_bp = Blueprint('characters', __name__)

# Import route modules
from .list_routes import *
from .detail_routes import *
from .create_routes import *
from .update_routes import *
from .delete_routes import *

# All routes are already registered with characters_bp in their respective modules 