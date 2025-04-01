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
from whitenoise import WhiteNoise

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

    # Configure WhiteNoise for static files with proper MIME types
    if static_folder_path and os.path.exists(static_folder_path):
        app.logger.info(f"Configuring WhiteNoise with static folder: {static_folder_path}")
        # Wrap the WSGI app with WhiteNoise
        white_noise = WhiteNoise(app.wsgi_app)
        # Add the static folder to the whitenoise application
        white_noise.add_files(static_folder_path, prefix='')
        
        # Explicitly add react-fixes directory (this is needed if nested in static folder)
        react_fixes_path = os.path.join(static_folder_path, 'react-fixes')
        if os.path.exists(react_fixes_path):
            app.logger.info(f"Adding React fixes directory to WhiteNoise: {react_fixes_path}")
            white_noise.add_files(react_fixes_path, prefix='react-fixes')
            white_noise.add_files(react_fixes_path, prefix='static/react-fixes')
        else:
            app.logger.warning(f"React fixes directory not found at: {react_fixes_path}")
        
        # Also explicitly add the static/react-fixes directory (for double-nesting scenarios)
        static_react_fixes_path = os.path.join(static_folder_path, 'static', 'react-fixes')
        if os.path.exists(static_react_fixes_path):
            app.logger.info(f"Adding static/react-fixes directory to WhiteNoise: {static_react_fixes_path}")
            white_noise.add_files(static_react_fixes_path, prefix='static/react-fixes')
        else:
            app.logger.warning(f"Static/react-fixes directory not found at: {static_react_fixes_path}")
        
        # Configure WhiteNoise to add proper MIME types
        # Explicitly register MIME types for specific file extensions
        mimetypes.add_type('application/javascript', '.js')
        mimetypes.add_type('application/javascript', '.mjs')
        mimetypes.add_type('application/javascript', '.jsx')
        mimetypes.add_type('text/css', '.css')
        mimetypes.add_type('image/svg+xml', '.svg')
        mimetypes.add_type('text/html', '.html')
        mimetypes.add_type('application/json', '.json')
        
        # Set the updated app.wsgi_app
        app.wsgi_app = white_noise
        app.logger.info("WhiteNoise configured successfully")
    else:
        app.logger.error(f"Cannot configure WhiteNoise: static folder not available")
        startup_errors.append("WhiteNoise configuration failed: static folder not available")

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
                            mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
                            
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

    # Debug endpoint for WhiteNoise
    @app.route('/api/debug/whitenoise')
    def debug_whitenoise():
        """Debug endpoint to report on WhiteNoise configuration"""
        try:
            whitenoise_info = {
                "configured": hasattr(app, 'wsgi_app') and isinstance(app.wsgi_app, WhiteNoise),
                "static_folder": app.static_folder,
                "files_count": len(getattr(app.wsgi_app, 'files', {})) if hasattr(app.wsgi_app, 'files') else 0,
            }
            
            # Get a sample of files being served by WhiteNoise
            if hasattr(app.wsgi_app, 'files') and app.wsgi_app.files:
                sample_files = list(app.wsgi_app.files.keys())[:10]  # Get first 10 files
                whitenoise_info["sample_files"] = sample_files
                
                # Get MIME types for sample files using Python's mimetypes module
                mime_types = {}
                for file in sample_files:
                    mime_types[file] = mimetypes.guess_type(file)[0] or 'unknown'
                
                whitenoise_info["mime_types"] = mime_types
            
            # Report global mimetypes configuration
            whitenoise_info["global_mimetypes"] = {
                ".js": mimetypes.guess_type("example.js")[0],
                ".mjs": mimetypes.guess_type("example.mjs")[0],
                ".css": mimetypes.guess_type("example.css")[0]
            }
            
            return jsonify(whitenoise_info), 200
        except Exception as e:
            app.logger.error(f"Error in WhiteNoise diagnostics: {str(e)}")
            return jsonify({
                "error": str(e),
                "traceback": traceback.format_exc()
            }), 500

    # Add module debug endpoint
    @app.route('/api/debug/module/<path:filename>')
    def debug_module(filename):
        """Debug endpoint to help track down module loading issues."""
        # Clean up filename if it has query parameters
        if '?' in filename:
            filename = filename.split('?')[0]
        
        # Add .js extension if not present
        if not filename.endswith('.js') and not filename.endswith('.mjs'):
            filename = f"{filename}.js"
        
        # Track all possible locations where the file might be
        possible_locations = []
        
        # Direct paths to check
        paths_to_check = [
            filename,
            f"assets/{filename}",
            f"static/{filename}",
            f"js/{filename}",
            f"static/assets/{filename}",
            f"assets/js/{filename}"
        ]
        
        file_content = None
        found_path = None
        
        # Check all possible paths
        for path in paths_to_check:
            if app.static_folder is None:
                full_path = None
                exists = False
                size = None
            else:
                full_path = os.path.join(app.static_folder, path)
                exists = os.path.exists(full_path)
                size = os.path.getsize(full_path) if exists else None
            
            location_info = {
                "path": path,
                "full_path": full_path,
                "exists": exists,
                "size": size
            }
            
            possible_locations.append(location_info)
            
            # If file exists, read its content
            if exists and full_path is not None and not found_path:
                found_path = path
                try:
                    with open(full_path, 'r') as f:
                        file_content = f.read(500)  # Read first 500 chars
                except Exception as e:
                    file_content = f"Error reading file: {str(e)}"
        
        # Also check if WhiteNoise would serve this file
        whitenoise_would_serve = False
        whitenoise_path = None
        if hasattr(app.wsgi_app, 'files'):
            # Check all possible variations of the path that WhiteNoise might use
            for test_path in [f"/{filename}", filename, f"/static/{filename}"]:
                if test_path in app.wsgi_app.files:
                    whitenoise_would_serve = True
                    whitenoise_path = test_path
                    break
        
        # Build the response
        response_data = {
            "requested_file": filename,
            "possible_locations": possible_locations,
            "file_found": found_path is not None,
            "found_at": found_path,
            "content_preview": file_content,
            "whitenoise_would_serve": whitenoise_would_serve,
            "whitenoise_path": whitenoise_path
        }
        
        return jsonify(response_data)
    
    # Remove the old after_request hook as WhiteNoise handles this now
    # Serve static files from the root URL - also handled by WhiteNoise now
    # But keep the catch-all route for SPA routing
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
        
        # For non-API routes, serve index.html for SPA routing
        # WhiteNoise should handle this, but keep as fallback
        try:
            app.logger.info('Serving index.html for client-side routing')
            if app.static_folder is not None and os.path.exists(os.path.join(app.static_folder, 'index.html')):
                return send_from_directory(app.static_folder, 'index.html')
            else:
                app.logger.error('index.html not found in static folder')
                return jsonify({
                    "error": "Missing index.html",
                    "message": "The index.html file could not be found in the static folder",
                }), 500
        except Exception as e:
            app.logger.error(f'Error in catch_all route: {str(e)}')
            app.logger.error(traceback.format_exc())
            return jsonify({
                "error": "Server Error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }), 500

    # Add a special fallback route for react-fix-loader.js
    @app.route('/static/react-fixes/react-fix-loader.js')
    def serve_react_fix_loader():
        """Serve the React fix loader file with the correct MIME type."""
        # Enhanced logging to track the root cause of requests
        referrer = request.headers.get('Referer', 'Unknown')
        user_agent = request.headers.get('User-Agent', 'Unknown')
        request_args = dict(request.args)
        app.logger.info(f"react-fix-loader.js requested: Referrer={referrer}, UA={user_agent}, Args={request_args}")
        
        # Track which HTML page is requesting this file
        if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
            try:
                with open(os.path.join(app.static_folder, 'index.html'), 'r') as f:
                    html_content = f.read()
                    # Check if the file is explicitly referenced in index.html
                    if 'react-fix-loader.js' in html_content:
                        app.logger.info(f"react-fix-loader.js is explicitly referenced in index.html")
                        # Try to get context of the reference (10 chars before and after)
                        try:
                            pos = html_content.find('react-fix-loader.js')
                            context_start = max(0, pos - 50)
                            context_end = min(len(html_content), pos + 50)
                            context = html_content[context_start:context_end]
                            app.logger.info(f"Reference context: {context}")
                        except Exception as e:
                            app.logger.warning(f"Error getting reference context: {str(e)}")
            except Exception as e:
                app.logger.warning(f"Error checking index.html: {str(e)}")
        
        # Look in multiple possible locations
        possible_paths = [
            os.path.join(app.static_folder, 'react-fixes/react-fix-loader.js') if app.static_folder else None,
            os.path.join(app.static_folder, 'static/react-fixes/react-fix-loader.js') if app.static_folder else None,
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixes/react-fix-loader.js'),
            './backend/fixes/react-fix-loader.js',
            './fixes/react-fix-loader.js'
        ]
        
        # Log request details to a separate file for analysis
        try:
            react_fix_log_dir = os.path.join('logs', 'react-fixes')
            os.makedirs(react_fix_log_dir, exist_ok=True)
            log_file = os.path.join(react_fix_log_dir, 'requests.log')
            
            with open(log_file, 'a') as f:
                log_entry = {
                    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'referrer': referrer,
                    'user_agent': user_agent,
                    'request_args': request_args,
                    'path': request.path,
                    'headers': dict(request.headers),
                }
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            app.logger.warning(f"Error logging react-fix request: {str(e)}")
        
        # Try to find the file in one of the possible locations
        for path in possible_paths:
            if path and os.path.exists(path):
                app.logger.info(f"Found react-fix-loader.js at: {path}")
                
                try:
                    # Get the directory and filename
                    directory = os.path.dirname(path)
                    filename = os.path.basename(path)
                    
                    # Serve the file with the correct MIME type
                    response = send_from_directory(directory, filename)
                    response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
                    return response
                except Exception as e:
                    app.logger.error(f"Error serving react-fix-loader.js: {str(e)}")
        
        # If file not found in any location, generate it on the fly
        app.logger.warning("react-fix-loader.js not found, generating on the fly")
        
        # Create a minimal version of the file
        js_content = """
/**
 * React Fix Loader - Minimal inline version
 */
console.log('React fix loader - inline version');

// Add diagnostic logging to help identify why this is being loaded
console.log('React fix loader requested from URL:', window.location.href);
console.log('Loader script element:', document.currentScript);
console.log('Document referrer:', document.referrer);

// Check if React is already available globally
if (typeof React === 'undefined') {
  console.warn('React not found, implementing basic polyfill');
  
  // Basic React polyfill
  window.React = {
    createElement: function(type, props) { 
      return { type, props: props || {} };
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

// Log diagnostic information to help track usage patterns
console.log('React fixes applied successfully at:', new Date().toISOString());
        """
        
        # Return the inline JavaScript with the correct MIME type
        response = app.response_class(
            response=js_content,
            mimetype='application/javascript'
        )
        return response

    # Add a React diagnostics endpoint
    @app.route('/api/debug/react')
    def debug_react():
        """Diagnostic endpoint for React loading issues."""
        try:
            # Check for React files in the static folder
            react_files = []
            react_related_paths = [
                'static/react-fixes',
                'react-fixes',
                'assets/react',
                'assets/vendor'
            ]
            
            if app.static_folder:
                for base_path in react_related_paths:
                    full_path = os.path.join(app.static_folder, base_path)
                    if os.path.exists(full_path) and os.path.isdir(full_path):
                        for root, _, files in os.walk(full_path):
                            for file in files:
                                rel_path = os.path.relpath(
                                    os.path.join(root, file), 
                                    app.static_folder
                                )
                                file_size = os.path.getsize(os.path.join(root, file))
                                react_files.append({
                                    'path': rel_path,
                                    'size': file_size
                                })
            
            # Check index.html for React references
            index_references = []
            if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
                try:
                    with open(os.path.join(app.static_folder, 'index.html'), 'r') as f:
                        html_content = f.read()
                        
                        # Look for common React-related patterns
                        patterns = [
                            'react', 'React', 'jsx', 'createRoot', 'ReactDOM',
                            'react-dom', 'react.production', 'react.development',
                            'react-fix', 'jsx-runtime'
                        ]
                        
                        for pattern in patterns:
                            pos = 0
                            while True:
                                pos = html_content.find(pattern, pos)
                                if pos == -1:
                                    break
                                
                                # Get some context around the match
                                start = max(0, pos - 40)
                                end = min(len(html_content), pos + len(pattern) + 40)
                                context = html_content[start:end]
                                
                                # Add to references
                                index_references.append({
                                    'pattern': pattern,
                                    'position': pos,
                                    'context': context
                                })
                                
                                # Move past this occurrence
                                pos += len(pattern)
                except Exception as e:
                    app.logger.warning(f"Error analyzing index.html: {str(e)}")
            
            # Check the diagnostic page
            diagnostic_page_exists = (
                app.static_folder and 
                os.path.exists(os.path.join(app.static_folder, 'react-diagnostic.html'))
            )
            
            # Build response data
            response_data = {
                'react_files': react_files,
                'react_files_count': len(react_files),
                'index_references': index_references,
                'index_references_count': len(index_references),
                'react_diagnostic_page': {
                    'exists': diagnostic_page_exists,
                    'url': '/react-diagnostic.html'
                },
                'potential_fixes': [
                    'Visit /react-diagnostic.html to test React loading directly',
                    'Ensure React is loaded before any module scripts',
                    'Try loading React from a CDN (already added in the latest update)',
                    'Check browser console for more specific error messages'
                ]
            }
            
            return jsonify(response_data), 200
        except Exception as e:
            app.logger.error(f"Error in React diagnostics: {str(e)}")
            return jsonify({
                'error': str(e),
                'traceback': traceback.format_exc()
            }), 500

    # Add special handlers for JSX runtime modules
    @app.route('/jsx-runtime/jsx-runtime.js')
    @app.route('/node_modules/react/jsx-runtime.js')
    @app.route('/node_modules/react/jsx-dev-runtime.js') 
    def serve_jsx_runtime():
        """Serve the JSX runtime module with proper MIME type."""
        app.logger.info(f"JSX runtime requested: {request.path}")
        
        # Map the requested path to our implementation
        if 'jsx-dev-runtime' in request.path:
            target_file = 'jsx-runtime/jsx-dev-runtime.js'
        else:
            target_file = 'jsx-runtime/jsx-runtime.js'
        
        # Serve from our static directory
        if app.static_folder and os.path.exists(os.path.join(app.static_folder, target_file)):
            response = send_from_directory(app.static_folder, target_file)
            response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
            return response
        
        # Fallback: generate content on the fly
        jsx_runtime_content = """
        /**
         * JSX Runtime - Dynamically generated
         */
        
        // Use the React global
        const React = window.React;
        
        // Implementation of jsx function
        export function jsx(type, props, key) {
          console.log('Dynamic JSX runtime called:', type);
          return React.createElement(type, props);
        }
        
        // jsxs is the same for our purposes
        export function jsxs(type, props, key) {
          return jsx(type, props, key);
        }
        
        // Export Fragment
        export const Fragment = React.Fragment || Symbol('Fragment');
        
        // Default export
        export default {
          jsx,
          jsxs,
          Fragment
        };
        
        console.log('Dynamic JSX runtime module loaded');
        """
        
        response = app.response_class(
            response=jsx_runtime_content,
            mimetype='application/javascript'
        )
        
        return response

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
