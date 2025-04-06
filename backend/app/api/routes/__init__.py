from flask import Blueprint, jsonify, current_app, request
import os
import sys
import platform
import json
from typing import Any, Dict, List, Optional, cast
from sqlalchemy import text

# Create API blueprint with version prefix
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import route modules
from .auth import auth_bp
from .universes import universes_bp
from .user import user_bp
from .modal import modal_bp
from .notes import notes_bp
from .characters import characters_bp
from .scenes import scenes_bp

# Register blueprints with correct prefixes
api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(universes_bp, url_prefix='/universes')
api_bp.register_blueprint(user_bp)
api_bp.register_blueprint(modal_bp)
api_bp.register_blueprint(notes_bp, url_prefix='/notes')
api_bp.register_blueprint(characters_bp, url_prefix='/characters')
api_bp.register_blueprint(scenes_bp, url_prefix='/scenes')

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'API is running'
    })

@api_bp.route('/diagnostics', methods=['GET'])
def diagnostics():
    """Endpoint to check system configuration and connectivity."""
    from flask import current_app
    from ...extensions import db
    
    info: Dict[str, Any] = {
        'system': {
            'python_version': platform.python_version(),
            'platform': platform.platform(),
            'cwd': os.getcwd(),
            'sys_path': sys.path
        },
        'app': {
            'static_folder': current_app.static_folder,
            'static_url_path': current_app.static_url_path,
            'debug': current_app.debug,
            'testing': current_app.testing,
            'flask_env': os.environ.get('FLASK_ENV', 'unknown'),
            'config': {k: str(v) for k, v in current_app.config.items() 
                      if not k.startswith('_') and k not in ['SECRET_KEY', 'JWT_SECRET_KEY']}
        }
    }
    
    # Test database connection
    try:
        db.session.execute(text('SELECT 1'))
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
    static_folder = cast(str, current_app.static_folder) if current_app.static_folder else None
    if static_folder and os.path.exists(static_folder):
        try:
            static_files = os.listdir(static_folder)
            static_info: Dict[str, Any] = {
                'count': len(static_files),
                'has_index': 'index.html' in static_files,
                'files': [f for f in static_files if os.path.isfile(os.path.join(static_folder, f))][:10]  # List first 10 files
            }
            
            # Add detailed check for assets directory and sub-directories
            assets_path = os.path.join(static_folder, 'assets')
            if os.path.exists(assets_path) and os.path.isdir(assets_path):
                assets_files = []
                for root, dirs, files in os.walk(assets_path):
                    rel_path = os.path.relpath(root, static_folder)
                    assets_files.append({
                        'directory': rel_path,
                        'files': files[:5]  # List first 5 files in each subdirectory
                    })
                static_info['assets'] = assets_files
            
            info['static_files'] = static_info
        except Exception as e:
            info['static_files'] = {
                'error': str(e)
            }
    else:
        info['static_files'] = {
            'error': f"Static folder not found: {static_folder}"
        }
    
    # Add detailed route listing
    routes = []
    if current_app.url_map:
        try:
            for rule in current_app.url_map.iter_rules():
                if rule and hasattr(rule, 'methods') and rule.methods:
                    routes.append({
                        'endpoint': rule.endpoint,
                        'methods': [m for m in rule.methods if m not in ['HEAD', 'OPTIONS']],
                        'path': str(rule)
                    })
        except Exception as e:
            routes.append({
                'error': f"Error iterating routes: {str(e)}"
            })
    info['routes'] = routes
    
    # Check environment variables (excluding sensitive ones)
    safe_env_vars = ['FLASK_ENV', 'FLASK_DEBUG', 'FLASK_APP', 'PYTHON_PATH', 
                     'PORT', 'RENDER', 'NODE_ENV', 'API_BASE_URL', 'STATIC_URL_PATH',
                     'STATIC_FOLDER']
    
    info['environment_variables'] = {key: os.environ.get(key) for key in safe_env_vars if key in os.environ}
    
    return jsonify(info)

# Static files test endpoint
@api_bp.route('/static-test', methods=['GET'])
def static_test():
    """Test endpoint to check static file access."""
    static_folder = current_app.static_folder
    
    result: Dict[str, Any] = {
        'static_folder': static_folder,
        'static_url_path': current_app.static_url_path
    }
    
    if static_folder and os.path.exists(static_folder):
        result['exists'] = "true"
        result['isdir'] = "true" if os.path.isdir(static_folder) else "false"
        
        # Get file listing
        try:
            files = os.listdir(static_folder)
            result['files'] = files[:10]  # First 10 files only
            result['file_count'] = str(len(files))
            result['has_index_html'] = "true" if 'index.html' in files else "false"
            
            # Check index.html content if it exists
            if 'index.html' in files:
                index_path = os.path.join(static_folder, 'index.html')
                try:
                    with open(index_path, 'r') as f:
                        content = f.read()
                        result['index_html_size'] = str(len(content))
                        result['index_html_sample'] = content[:100] + '...'  # First 100 chars
                except Exception as e:
                    result['index_html_error'] = str(e)
        except Exception as e:
            result['list_error'] = str(e)
    else:
        result['exists'] = "false"
        
    # Check alternate static directories
    alt_dirs = [
        '/opt/render/project/src/static',
        '/opt/render/project/src/backend/app/static',
        os.path.join(os.getcwd(), 'static'),
        os.path.join(os.getcwd(), 'backend', 'app', 'static')
    ]
    
    alt_dirs_info = []
    for alt_dir in alt_dirs:
        alt_info: Dict[str, Any] = {
            'path': alt_dir,
            'exists': "true" if os.path.exists(alt_dir) else "false",
        }
        if os.path.exists(alt_dir) and os.path.isdir(alt_dir):
            try:
                files = os.listdir(alt_dir)
                alt_info['file_count'] = str(len(files))
                alt_info['has_index_html'] = "true" if 'index.html' in files else "false"
            except Exception as e:
                alt_info['error'] = str(e)
        alt_dirs_info.append(alt_info)
    
    result['alternate_dirs'] = alt_dirs_info
    
    return jsonify(result)
