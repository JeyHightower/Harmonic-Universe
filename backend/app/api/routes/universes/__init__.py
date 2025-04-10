from flask import Blueprint

universes_bp = Blueprint('universes', __name__)

# Import route modules
from .list_routes import *
from .detail_routes import *
from .create_routes import *
from .update_routes import *
from .delete_routes import *
from .related_routes import *
from .repair_routes import *

# All routes are already registered with universes_bp in their respective modules 