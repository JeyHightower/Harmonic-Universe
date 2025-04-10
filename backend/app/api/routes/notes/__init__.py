from flask import Blueprint

notes_bp = Blueprint('notes', __name__)

# Import route modules
from .universe_routes import *
from .scene_routes import *
from .character_routes import *
from .detail_routes import *
from .create_routes import *
from .update_routes import *
from .delete_routes import *
from .archive_routes import *

# All routes are already registered with notes_bp in their respective modules 