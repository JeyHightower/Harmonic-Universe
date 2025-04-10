from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

# Import route modules
from .signup import *
from .login import *
from .logout import *
from .demo import *
from .token import *
from .debug import *

# All routes are already registered with auth_bp in their respective modules 