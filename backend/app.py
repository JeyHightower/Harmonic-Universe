from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys
import json
import traceback
import logging
import time
import platform
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
from typing import Optional, Dict, List, Any, Union
import mimetypes

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Global error counter
startup_errors = []

# Add this after the startup_errors declaration
try:
    # Import and apply MIME type overrides
    from fixes.mime_override import apply_mime_overrides
    apply_mime_overrides()
    print("MIME type overrides successfully applied")
except ImportError:
    print("MIME override module not found, continuing without MIME patches")
except Exception as e:
    print(f"Error applying MIME overrides: {str(e)}")
    startup_errors.append(f"MIME override error: {str(e)}")

# Ensure proper MIME types for JavaScript files
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/javascript', '.jsx')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')

def create_app():
    # Create Flask application with absolute path to static folder
    static_folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    app = Flask(__name__, static_folder=static_folder_path, static_url_path="")
    
    # Print debugging information about static folder
    print(f"Static folder absolute path: {static_folder_path}")
    print(f"Static folder exists: {os.path.exists(static_folder_path)}")
    
    # Detailed static folder inspection
    if os.path.exists(static_folder_path):
        static_contents = os.listdir(static_folder_path)
        print(f"Static folder contains {len(static_contents)} items")
        
        # Log all entries in static folder
        for item in static_contents:
            item_path = os.path.join(static_folder_path, item)
            if os.path.isdir(item_path):
                try:
                    subcontents = os.listdir(item_path)
                    print(f"  - Directory '{item}/' ({len(subcontents)} items)")
                except Exception as e:
                    print(f"  - Directory '{item}/' (error listing: {str(e)})")
            else:
                try:
                    size = os.path.getsize(item_path)
                    print(f"  - File '{item}' ({size} bytes)")
                except Exception as e:
                    print(f"  - File '{item}' (error getting size: {str(e)})")
        
        # Specifically check for index.html
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            try:
                size = os.path.getsize(index_path)
                print(f"index.html exists in static folder (size: {size} bytes)")
                # Read first few lines of index.html
                with open(index_path, 'r') as f:
                    content = f.read(200)
                    print(f"index.html first 200 chars: {content}")
            except Exception as e:
                print(f"Error reading index.html: {str(e)}")
        else:
            print(f"index.html does NOT exist in static folder")
            startup_errors.append("Missing index.html in static folder")
    else:
        print(f"Static folder does not exist, attempting to create it")
        try:
            os.makedirs(static_folder_path)
            print(f"Created static folder: {static_folder_path}")
        except Exception as e:
            print(f"Failed to create static folder: {str(e)}")
            startup_errors.append(f"Failed to create static folder: {str(e)}")

    # Load minimal configuration
    app.config.update({
        'SECRET_KEY': os.environ.get('SECRET_KEY', 'dev-key-please-change'),
        'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'LOG_LEVEL': logging.INFO,
        'LOG_FORMAT': '%(asctime)s %(levelname)s: %(message)s',
    })

    # Configure CORS - allow all origins for testing
    CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})

    # Configure logging
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        try:
            os.mkdir(log_dir)
        except Exception as e:
            print(f"Failed to create logs directory: {str(e)}")
            startup_errors.append(f"Failed to create logs directory: {str(e)}")
    
    try:
        file_handler = RotatingFileHandler(os.path.join(log_dir, 'app.log'), maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(app.config['LOG_FORMAT']))
        file_handler.setLevel(app.config['LOG_LEVEL'])
        app.logger.addHandler(file_handler)
        app.logger.setLevel(app.config['LOG_LEVEL'])
    except Exception as e:
        print(f"Failed to configure logging: {str(e)}")
        startup_errors.append(f"Failed to configure logging: {str(e)}")

    # Configure console logging as well
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(app.config['LOG_FORMAT']))
    console_handler.setLevel(app.config['LOG_LEVEL'])
    app.logger.addHandler(console_handler)
    
    app.logger.info('Application startup')
    for error in startup_errors:
        app.logger.error(f"Startup error: {error}")

    # Add health check endpoint
    @app.route('/api/health')
    def health_check():
        health_data = {
            "status": "healthy" if not startup_errors else "degraded",
            "timestamp": time.time(),
            "message": "API is running",
            "startup_errors": startup_errors,
            "python_version": sys.version,
            "platform": platform.platform(),
        }
        
        # Check if static folder and index.html exist
        static_folder = app.static_folder
        if static_folder is not None:
            health_data["static_folder_exists"] = os.path.exists(static_folder)
            
            if health_data["static_folder_exists"]:
                index_path = os.path.join(static_folder, 'index.html')
                health_data["index_exists"] = os.path.exists(index_path)
        else:
            health_data["static_folder_exists"] = False
        
        return jsonify(health_data), 200

    # Debug endpoint to check static files
    @app.route('/api/debug/static')
    def debug_static():
        static_folder = app.static_folder
        files = []
        mime_types = {
            '.js': 'application/javascript',
            '.mjs': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
        }
        
        try:
            if static_folder is not None and os.path.exists(static_folder):
                for root, dirs, root_files in os.walk(static_folder):
                    rel_path = os.path.relpath(root, static_folder)
                    if rel_path == '.':
                        rel_path = ''
                    
                    for file in root_files:
                        file_path = os.path.join(root, file)
                        rel_file_path = os.path.join(rel_path, file) if rel_path else file
                        
                        try:
                            size = os.path.getsize(file_path)
                            ext = os.path.splitext(file)[1].lower()
                            mime_type = mime_types.get(ext, 'application/octet-stream')
                            
                            files.append({
                                'path': rel_file_path,
                                'size': size,
                                'mime_type': mime_type
                            })
                        except Exception as e:
                            files.append({
                                'path': rel_file_path,
                                'error': str(e)
                            })
        except Exception as e:
            return jsonify({
                "error": str(e),
                "traceback": traceback.format_exc()
            }), 500
        
        index_content = ""
        if static_folder is not None and os.path.exists(os.path.join(static_folder, 'index.html')):
            try:
                with open(os.path.join(static_folder, 'index.html'), 'r') as f:
                    content = f.read()
                    index_content = content[:200] + "..." if len(content) > 200 else content
            except Exception as e:
                index_content = f"Error reading file: {str(e)}"
        
        response_data = {
            "static_folder": static_folder,
            "static_url_path": app.static_url_path,
            "static_folder_exists": static_folder is not None and os.path.exists(static_folder),
            "files": files,
            "file_count": len(files),
            "index_exists": static_folder is not None and os.path.exists(os.path.join(static_folder, 'index.html')),
            "index_preview": index_content,
            "startup_errors": startup_errors
        }
        
        return jsonify(response_data), 200
    
    # Add system diagnostics endpoint
    @app.route('/api/debug/system')
    def debug_system():
        try:
            # Collect system information
            system_info = {
                "platform": platform.platform(),
                "python_version": sys.version,
                "python_path": sys.executable,
                "cwd": os.getcwd(),
                "env_vars": {
                    k: v for k, v in os.environ.items() 
                    if not k.lower().startswith(('secret', 'password', 'key'))
                },
                "path": sys.path,
                "startup_errors": startup_errors
            }
            
            # Check disk space
            try:
                import shutil
                total, used, free = shutil.disk_usage("/")
                system_info["disk"] = {
                    "total_gb": total / (1024**3),
                    "used_gb": used / (1024**3),
                    "free_gb": free / (1024**3),
                    "percent_used": (used / total) * 100
                }
            except Exception as e:
                system_info["disk_error"] = str(e)
            
            # Check memory usage
            try:
                import psutil
                mem = psutil.virtual_memory()
                system_info["memory"] = {
                    "total_mb": mem.total / (1024**2),
                    "available_mb": mem.available / (1024**2),
                    "percent_used": mem.percent
                }
                
                # Process info
                process = psutil.Process()
                proc_info = process.memory_info()
                system_info["process"] = {
                    "pid": process.pid,
                    "memory_rss_mb": proc_info.rss / (1024**2),
                    "memory_vms_mb": proc_info.vms / (1024**2),
                    "cpu_percent": process.cpu_percent(interval=0.1),
                    "threads": process.num_threads()
                }
            except Exception as e:
                system_info["memory_error"] = str(e)
            
            return jsonify(system_info), 200
        except Exception as e:
            app.logger.error(f"Error in system diagnostics: {str(e)}")
            return jsonify({
                "error": str(e),
                "traceback": traceback.format_exc()
            }), 500

    # Direct serve function for any file in static
    @app.route('/staticfile/<path:filename>')
    def send_file(filename):
        app.logger.info(f"Explicit request for static file: {filename}")
        if app.static_folder is not None:
            return send_from_directory(app.static_folder, filename)
        return jsonify({"error": "Static folder not configured"}), 500

    # Serve static files from the root URL
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        # Log the requested path
        app.logger.info(f'Catch-all route accessed with path: {path}')
        
        # Exclude API routes from this handling
        if path.startswith('api/'):
            app.logger.info(f'API path detected: {path}')
            return jsonify({
                'error': 'Not Found',
                'message': f'API endpoint /{path} not found'
            }), 404
        
        # Define content types for common extensions to ensure proper MIME types
        content_types = {
            '.js': 'application/javascript',
            '.mjs': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
        }
        
        # Check for static folder
        if app.static_folder is None:
            app.logger.error('Static folder is not configured')
            return jsonify({
                "error": "Configuration Error",
                "message": "Static folder is not configured"
            }), 500
        
        # Try to serve as a static file first
        try:
            if path and os.path.exists(os.path.join(app.static_folder, path)):
                app.logger.info(f'Serving static file: {path}')
                
                # Get file extension and determine content type
                ext = os.path.splitext(path)[1].lower()
                mimetype = content_types.get(ext)
                
                # Log detailed information about the file
                file_path = os.path.join(app.static_folder, path)
                file_size = os.path.getsize(file_path)
                app.logger.info(f'File details: path={file_path}, size={file_size}, mimetype={mimetype}')
                
                return send_from_directory(app.static_folder, path, mimetype=mimetype)
                
            # Special handling for JavaScript module files that might have different paths
            if path.endswith('.js') or path.endswith('.mjs'):
                # Try alternative paths where the file might be located
                possible_js_paths = [
                    f"assets/{path}",
                    f"assets/js/{path}",
                    f"js/{path}"
                ]
                
                for js_path in possible_js_paths:
                    if os.path.exists(os.path.join(app.static_folder, js_path)):
                        app.logger.info(f'Serving JS file from alternative path: {js_path}')
                        return send_from_directory(app.static_folder, js_path, mimetype='application/javascript')
            
            # If path is empty or file doesn't exist, serve index.html
            app.logger.info(f'Static file not found, serving index.html instead')
            index_path = os.path.join(app.static_folder, 'index.html')
            if os.path.exists(index_path):
                index_size = os.path.getsize(index_path)
                app.logger.info(f'Serving index.html (size: {index_size} bytes)')
                return send_from_directory(app.static_folder, 'index.html')
            else:
                app.logger.error('index.html not found in static folder')
                return jsonify({
                    "error": "Missing index.html",
                    "message": "The index.html file could not be found in the static folder",
                    "static_folder": app.static_folder,
                    "static_contents": os.listdir(app.static_folder) if os.path.exists(app.static_folder) else []
                }), 500
        except Exception as e:
            app.logger.error(f'Error in catch_all route: {str(e)}')
            app.logger.error(traceback.format_exc())
            return jsonify({
                "error": "Server Error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }), 500

    # Find the section for serving static files
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        """Serve static files with proper MIME types."""
        # Determine correct MIME type based on file extension
        mime_type = None
        if filename.endswith('.js'):
            mime_type = 'application/javascript'
        elif filename.endswith('.mjs'):
            mime_type = 'application/javascript'
        elif filename.endswith('.jsx'):
            mime_type = 'application/javascript'
        elif filename.endswith('.css'):
            mime_type = 'text/css'
        elif filename.endswith('.svg'):
            mime_type = 'image/svg+xml'
        elif filename.endswith('.json'):
            mime_type = 'application/json'
        
        # Serve the file with the determined MIME type
        if app.static_folder is not None:
            return send_from_directory(app.static_folder, filename, mimetype=mime_type)
        
        app.logger.error(f"Static folder not configured, cannot serve {filename}")
        return jsonify({"error": "Static folder not configured"}), 500

    # Add after the existing route for serving static files
    @app.route('/static/react-fixes/<path:filename>')
    def serve_react_fixes(filename):
        """Serve React fixes with the correct MIME type."""
        app.logger.info(f"Serving React fix: {filename}")
        
        # Ensure static folder is configured
        if app.static_folder is None:
            app.logger.error("Static folder not configured, cannot serve React fixes")
            return jsonify({"error": "Static folder not configured"}), 500
        
        # Define the path to the react-fixes directory
        react_fixes_dir = os.path.join(app.static_folder, 'static', 'react-fixes')
        
        # If the directory doesn't exist, try to create it
        if not os.path.exists(react_fixes_dir):
            app.logger.warning(f"React fixes directory not found at {react_fixes_dir}, creating it")
            try:
                os.makedirs(react_fixes_dir, exist_ok=True)
            except Exception as e:
                app.logger.error(f"Failed to create React fixes directory: {str(e)}")
                return jsonify({"error": f"Failed to create React fixes directory: {str(e)}"}), 500
        
        # Check if the requested file exists
        file_path = os.path.join(react_fixes_dir, filename)
        if not os.path.exists(file_path):
            app.logger.warning(f"React fix file not found: {file_path}")
            
            # If react-fix-loader.js is requested but not found, create a simple version
            if filename == 'react-fix-loader.js':
                app.logger.info("Creating minimal react-fix-loader.js")
                try:
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'w') as f:
                        f.write("""
/**
 * React Fix Loader (Minimal Version)
 */
console.log('Loading React fixes...');

// Check if React is already available globally
if (typeof React === 'undefined') {
  console.warn('React not found, implementing basic polyfill');
  
  // Basic React polyfill
  window.React = {
    createElement: function() { 
      return { type: arguments[0], props: arguments[1] || {} };
    },
    createContext: function() {
      return {
        Provider: function(props) { return props.children; },
        Consumer: function(props) { return props.children; }
      };
    },
    Fragment: Symbol('React.Fragment')
  };
  
  // Add JSX runtime compatibility
  window.jsx = window.React.createElement;
  window.jsxs = window.React.createElement;
}

console.log('React fixes applied successfully');
                        """)
                except Exception as e:
                    app.logger.error(f"Failed to create minimal react-fix-loader.js: {str(e)}")
                    return jsonify({"error": f"Failed to create React fix file: {str(e)}"}), 500
            else:
                return jsonify({"error": f"React fix file not found: {filename}"}), 404
        
        # Serve the file with the correct MIME type
        return send_from_directory(os.path.dirname(file_path), os.path.basename(file_path), 
                                   mimetype='application/javascript')

    return app

try:
    # Create the application instance
    app = create_app()

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        app.logger.warning(f'Not Found: {request.url}')
        # Return index.html for non-API routes to support client-side routing
        if not request.path.startswith('/api/'):
            try:
                app.logger.info(f'Serving index.html for 404 path: {request.path}')
                if app.static_folder is not None and os.path.exists(os.path.join(app.static_folder, 'index.html')):
                    return send_from_directory(app.static_folder, 'index.html')
                else:
                    app.logger.error(f'Static folder missing or index.html not found')
                    return jsonify({
                        "error": "Not Found",
                        "message": "Path not found and index.html not available"
                    }), 404
            except Exception as e:
                app.logger.error(f'Error serving index.html for 404: {e}')
                return jsonify({
                    "error": "Not Found",
                    "message": f"Path not found and could not serve index.html: {str(e)}"
                }), 500
        
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404

    @app.errorhandler(500)
    def server_error(error):
        app.logger.error(f'Server Error: {str(error)}')
        app.logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'details': str(error) if app.debug else None
        }), 500

except Exception as e:
    print(f"CRITICAL ERROR during app initialization: {str(e)}")
    print(traceback.format_exc())
    startup_errors.append(f"Critical initialization error: {str(e)}")
    
    # Create a minimal fallback app
    app = Flask(__name__)
    
    @app.route('/')
    def fallback_root():
        error_info = {
            "error": "Application initialization failed",
            "message": f"The server encountered an error during initialization: {str(e)}",
            "startup_errors": startup_errors,
            "traceback": traceback.format_exc()
        }
        return jsonify(error_info), 500
    
    @app.route('/api/health')
    def fallback_health():
        return jsonify({
            "status": "error", 
            "message": f"Error during initialization: {str(e)}",
            "startup_errors": startup_errors,
            "traceback": traceback.format_exc()
        }), 500
    
    @app.route('/api/debug/error')
    def fallback_debug():
        return jsonify({
            "initialization_error": str(e),
            "startup_errors": startup_errors,
            "traceback": traceback.format_exc(),
            "python_version": sys.version,
            "platform": platform.platform(),
            "cwd": os.getcwd(),
        }), 500

# Run the application
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)
