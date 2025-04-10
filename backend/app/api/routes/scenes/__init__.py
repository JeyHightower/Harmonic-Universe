from flask import Blueprint

scenes_bp = Blueprint('scenes', __name__)

# Import the route modules
from .list_routes import *
from .get_routes import *
from .create_routes import *
from .update_routes import *
from .delete_routes import *

# All routes are already registered with scenes_bp in their respective modules 