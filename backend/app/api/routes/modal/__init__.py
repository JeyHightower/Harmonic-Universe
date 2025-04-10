from flask import Blueprint

modal_bp = Blueprint('modal', __name__)

# In-memory storage for modal state
modal_state = {
    'isOpen': False,
    'type': None,
    'props': {},
    'transition': None
}

# Import route modules
from .open_routes import *
from .close_routes import *
from .props_routes import *
from .state_routes import *

# All routes are already registered with modal_bp in their respective modules 