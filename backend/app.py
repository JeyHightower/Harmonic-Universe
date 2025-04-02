from flask import Flask, jsonify, request, send_from_directory, Response, redirect
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

    # ==============================================================
    # TEMPORARILY DISABLE WHITENOISE FOR TESTING DIRECT FILE SERVING
    # ==============================================================
    # print("WHITENOISE TEMPORARILY DISABLED FOR TROUBLESHOOTING")
    # app.logger.warning("WHITENOISE TEMPORARILY DISABLED - Using direct file serving")
    # ==============================================================

    # Add an extremely simple text-only endpoint as a minimal test
    @app.route('/simple-text')
    def simple_text():
        """Simplest possible text response"""
        content = "This is a simple text response from Harmonic Universe."
        app.logger.info(f"Serving simple text response ({len(content)} bytes)")
        return Response(
            content,
            mimetype='text/plain',
            headers={'Content-Length': str(len(content))}
        )

    # Add a direct test endpoint that bypasses all middleware
    @app.route('/direct-test')
    def direct_test():
        """A direct test endpoint that returns a simple HTML page"""
        app.logger.info("Direct test endpoint called - bypassing all middleware")
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Direct Test Response</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .success { color: green; font-weight: bold; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                pre { background: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Harmonic Universe - Direct Test Response</h1>
                <p class="success">If you can see this page, direct responses are working correctly!</p>
                <p>This response was generated directly from Flask, bypassing all middleware.</p>
                
                <h2>Server Information</h2>
                <pre>
                Time: %s
                Python: %s
                Static Folder: %s
                Static Folder Exists: %s
                </pre>
                
                <h2>Next Steps</h2>
                <p>Try these other test endpoints:</p>
                <ul>
                    <li><a href="/direct-index">Direct Index Test</a> - Serve index.html directly</li>
                    <li><a href="/api/debug/static-files">Static Files Debug</a> - View static files details</li>
                    <li><a href="/test.html">Test HTML</a> - Check static file serving</li>
                    <li><a href="/simple-text">Simple Text Response</a> - Basic text response test</li>
                </ul>
            </div>
        </body>
        </html>
        """ % (
            time.strftime("%Y-%m-%d %H:%M:%S"),
            sys.version,
            app.static_folder,
            os.path.exists(app.static_folder) if app.static_folder else False
        )
        
        # Create response object manually, avoiding any middleware
        response = app.response_class(
            response=html_content,
            status=200,
            mimetype='text/html'
        )
        
        # Force content length header
        response.headers['Content-Length'] = str(len(html_content))
        
        # Log response details for debugging
        content_length = len(html_content)
        app.logger.info(f"Created direct test response with {content_length} bytes")
        app.logger.info(f"Response headers: {dict(response.headers)}")
        
        return response
    
    # Add a direct index.html test endpoint
    @app.route('/direct-index')
    def direct_index_test():
        """Serve index.html directly bypassing middleware"""
        app.logger.info("Direct index.html test endpoint called")
        
        if app.static_folder is None:
            app.logger.error("Static folder not configured for direct index test")
            return "Static folder not configured", 500
        
        index_path = os.path.join(app.static_folder, 'index.html')
        app.logger.info(f"Looking for index.html at: {index_path}")
        
        if not os.path.exists(index_path):
            app.logger.error(f"index.html not found at {index_path} for direct test")
            return "index.html not found", 404
        
        try:
            # Read file content directly
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content_length = len(content)
            app.logger.info(f"Read index.html for direct test: {content_length} bytes")
            
            # Log a preview of the content
            preview = content[:200] + "..." if len(content) > 200 else content
            app.logger.info(f"Content preview: {preview}")
            
            # Create response directly
            response = app.response_class(
                response=content,
                status=200,
                mimetype='text/html'
            )
            
            # Force content length header
            response.headers['Content-Length'] = str(content_length)
            
            app.logger.info(f"Created direct index response with {content_length} bytes and headers: {dict(response.headers)}")
            
            return response
        except Exception as e:
            app.logger.error(f"Error in direct index test: {str(e)}")
            app.logger.error(traceback.format_exc())
            return f"Error: {str(e)}", 500

    # Configure WhiteNoise for static files with proper MIME types
    if static_folder_path and os.path.exists(static_folder_path):
        app.logger.info(f"Configuring WhiteNoise with static folder: {static_folder_path}")
        
        # Explicitly register MIME types for specific file extensions
        mimetypes.add_type('text/html', '.html')
        mimetypes.add_type('application/javascript', '.js')
        mimetypes.add_type('application/javascript', '.mjs')
        mimetypes.add_type('application/javascript', '.jsx')
        mimetypes.add_type('text/css', '.css')
        mimetypes.add_type('image/svg+xml', '.svg')
        mimetypes.add_type('application/json', '.json')
        
        # TEMPORARILY DISABLE WHITENOISE FOR TROUBLESHOOTING
        app.logger.warning("===== WHITENOISE TEMPORARILY DISABLED FOR TROUBLESHOOTING =====")
        app.logger.warning("Using direct file serving instead of WhiteNoise")
        
        # Comment out WhiteNoise initialization
        '''
        # Wrap the WSGI app with WhiteNoise
        white_noise = WhiteNoise(app.wsgi_app)
        # Add the static folder to the whitenoise application with proper MIME types
        white_noise.add_files(static_folder_path, prefix='')
        
        # Set the updated app.wsgi_app
        app.wsgi_app = white_noise
        app.logger.info("WhiteNoise configured successfully")
        
        # Log all available files
        try:
            files_count = len(getattr(white_noise, 'files', {}))
            app.logger.info(f"WhiteNoise serving {files_count} files")
            
            # Log a sample of files being served
            if files_count > 0:
                sample_files = list(white_noise.files.keys())[:5]
                app.logger.info(f"Sample files: {', '.join(sample_files)}")
        except Exception as e:
            app.logger.error(f"Error checking WhiteNoise files: {str(e)}")
        '''
    else:
        app.logger.error(f"Cannot configure WhiteNoise: static folder not available")
        startup_errors.append("WhiteNoise configuration failed: static folder not available")

    return app