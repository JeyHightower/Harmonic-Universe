from flask import Blueprint

user_bp = Blueprint('user', __name__)

# Import route modules
from .profile_routes import *

# All routes are already registered with user_bp in their respective modules 