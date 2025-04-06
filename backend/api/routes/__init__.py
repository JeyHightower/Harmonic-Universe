from flask import Blueprint, jsonify, current_app
import os
import sys
import platform
import sqlalchemy
from ...extensions import db

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import and register other blueprints
from .auth import auth_bp
from .user import user_bp
from .universes import universes_bp
from .scenes import scenes_bp
from .characters import characters_bp
from .notes import notes_bp

api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(user_bp)
api_bp.register_blueprint(universes_bp)
api_bp.register_blueprint(scenes_bp)
api_bp.register_blueprint(characters_bp)
api_bp.register_blueprint(notes_bp)

# Add diagnostic routes
@api_bp.route('/diagnostics', methods=['GET'])
def diagnostics():
    """Endpoint to check system configuration and connectivity."""
    
    # Collect diagnostic information
    info = {
        'system': {
            'python_version': sys.version,
            'platform': platform.platform(),
            'node': platform.node(),
            'processor': platform.processor(),
        },
        'application': {
            'sqlalchemy_version': sqlalchemy.__version__,
            'environment': os.environ.get('FLASK_ENV', 'not set'),
            'debug': current_app.debug,
            'testing': current_app.testing,
            'render_environment': os.environ.get('RENDER', 'False').lower() == 'true',
        },
        'configuration': {
            'static_folder': current_app.static_folder,
            'static_url_path': current_app.static_url_path,
            'database_url': current_app.config['SQLALCHEMY_DATABASE_URI'].replace(
                # Hide credentials in output
                'postgresql://', 'postgresql://****:****@'
            ) if current_app.config['SQLALCHEMY_DATABASE_URI'] else None,
        }
    }
    
    # Test database connection
    try:
        db.session.execute('SELECT 1')
        info['database'] = {
            'connection': 'successful',
            'dialect': db.engine.dialect.name,
            'driver': db.engine.driver
        }
    except Exception as e:
        info['database'] = {
            'connection': 'failed',
            'error': str(e)
        }
    
    # Check static files
    if current_app.static_folder and os.path.exists(current_app.static_folder):
        try:
            static_files = os.listdir(current_app.static_folder)
            info['static_files'] = {
                'count': len(static_files),
                'has_index': 'index.html' in static_files,
                'files': [f for f in static_files if os.path.isfile(os.path.join(current_app.static_folder, f))][:10]  # List first 10 files
            }
        except Exception as e:
            info['static_files'] = {
                'error': str(e)
            }
    
    # Check environment variables (excluding sensitive ones)
    safe_env_vars = ['FLASK_ENV', 'FLASK_DEBUG', 'FLASK_APP', 'PYTHON_PATH', 
                     'PORT', 'RENDER', 'NODE_ENV', 'API_BASE_URL', 'STATIC_URL_PATH']
    
    info['environment_variables'] = {key: os.environ.get(key) for key in safe_env_vars if key in os.environ}
    
    return jsonify(info) 