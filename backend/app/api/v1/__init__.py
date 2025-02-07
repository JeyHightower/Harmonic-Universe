from flask import Blueprint
from .auth import auth_bp
from .projects import projects_bp
from .audio import audio_bp
from .visualizations import viz_bp

api_bp = Blueprint('api', __name__)

api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(projects_bp, url_prefix='/projects')
api_bp.register_blueprint(audio_bp, url_prefix='/audio')
api_bp.register_blueprint(viz_bp, url_prefix='/visualizations')
