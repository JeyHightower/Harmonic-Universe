#!/usr/bin/env python
"""
Standalone WSGI application for Render.com.
This file creates a basic Flask application that can run independently.
"""
import os
import sys
import logging
from flask import Flask, jsonify, send_from_directory, render_template_string, request

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Starting standalone app.wsgi module")

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to sys.path")

# Create a basic Flask application with the correct static folder
# First determine the appropriate static folder based on environment
render_static_dir = "/opt/render/project/src/static"
project_static_dir = os.path.join(current_dir, 'static')
app_static_dir = os.path.join(current_dir, 'app', 'static')

# Check which directory exists and use it, with a preference for the Render path
for static_path in [render_static_dir, project_static_dir, app_static_dir]:
    if os.path.exists(static_path):
        static_folder = static_path
        logger.info(f"Found existing static folder: {static_folder}")
        break
else:
    # Default to the render path if none exist
    static_folder = render_static_dir
    logger.info(f"Using default static folder: {static_folder}")

# Create the app with the correct static folder
application = Flask(__name__, static_folder=static_folder, static_url_path='')
logger.info(f"Created Flask app with static_folder: {static_folder}")

# Print the Python path for debugging
logger.info(f"Python path: {sys.path}")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Directory contents: {os.listdir('.')}")
if os.path.exists('app'):
    logger.info(f"App directory contents: {os.listdir('app')}")

# Ensure static directory exists and has content
if not os.path.exists(static_folder):
    try:
        os.makedirs(static_folder, exist_ok=True)
        logger.info(f"Created static directory: {static_folder}")
    except Exception as e:
        logger.error(f"Failed to create static directory: {e}")

# Check static directory contents
try:
    if os.path.exists(static_folder):
        logger.info(f"Static directory contents: {os.listdir(static_folder)}")

    # Verify index.html exists
    index_path = os.path.join(static_folder, 'index.html')
    if not os.path.exists(index_path):
        logger.error(f"index.html not found at {index_path}")

        # Create a default index.html if it doesn't exist
        try:
            with open(index_path, 'w') as f:
                f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .button {
            display: inline-block;
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
            color: white;
            text-decoration: none;
            padding: 0.8rem 1.8rem;
            border-radius: 30px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe platform. The application is running in standalone mode.</p>
        <p>This is a creative platform for music and physics visualization.</p>
        <div>
            <a href="/api/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
        </div>
    </div>
</body>
</html>""")
            logger.info("Created default index.html")
        except Exception as e:
            logger.error(f"Failed to create default index.html: {e}")
except Exception as e:
    logger.error(f"Error checking static directory: {e}")

# Basic routes for health check
@application.route('/')
def home():
    """Serve the home page."""
    logger.info("Home route called")
    try:
        index_path = os.path.join(static_folder, 'index.html')
        logger.info(f"Looking for index.html at {index_path}")
        if os.path.exists(index_path):
            logger.info(f"index.html found at {index_path}")
            try:
                with open(index_path, 'r') as f:
                    html_content = f.read()
                logger.info(f"Read {len(html_content)} bytes from index.html")

                # Force response to be proper HTML with explicit headers
                response = application.response_class(
                    response=html_content,
                    status=200,
                    mimetype='text/html',
                    headers={
                        'Content-Type': 'text/html; charset=utf-8',
                        'Content-Length': str(len(html_content))
                    }
                )
                logger.info(f"Created response with content length: {len(html_content)}")
                return response
            except Exception as file_err:
                logger.exception(f"Error reading index.html: {file_err}")
                # Use the embedded HTML approach as fallback
                return direct_html_response("Error reading index.html file")
        else:
            logger.error(f"index.html not found at {index_path}")
            # Return a fallback HTML response
            return direct_html_response("index.html file not found")
    except Exception as e:
        logger.exception(f"Error in home route: {e}")
        # Last resort fallback
        return direct_html_response(f"Error in home route: {str(e)}")

def direct_html_response(message=""):
    """Generate a direct HTML response without file reading."""
    logger.info(f"Generating direct HTML response: {message}")
    fallback_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }}
        .container {{
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }}
        h1 {{
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }}
        p {{
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }}
        .message {{
            background-color: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
            color: white;
            text-decoration: none;
            padding: 0.8rem 1.8rem;
            border-radius: 30px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }}
        .button:hover {{
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Direct HTML response from the server</p>
        {f'<div class="message">{message}</div>' if message else ''}
        <div>
            <a href="/api/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
        </div>
    </div>
</body>
</html>"""

    # Force response to be proper HTML with explicit headers
    response = application.response_class(
        response=fallback_html,
        status=200,
        mimetype='text/html',
        headers={
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': str(len(fallback_html))
        }
    )
    logger.info(f"Created direct HTML response with content length: {len(fallback_html)}")
    return response

@application.route('/direct')
def direct_route():
    """Direct HTML route that doesn't rely on file reading."""
    return direct_html_response("Accessed via /direct endpoint")

@application.before_request
def log_request_info():
    """Log details before each request."""
    logger.info(f"Request: {request.method} {request.path}")
    logger.info(f"Headers: {dict(request.headers)}")

@application.after_request
def log_response_info(response):
    """Log details after each request."""
    logger.info(f"Response: {response.status_code}")
    logger.info(f"Response headers: {dict(response.headers)}")
    content_length = response.headers.get('Content-Length', 'unknown')
    logger.info(f"Response content length: {content_length}")

    # If content-length is 0 or missing, check if we can fix it
    if not content_length or content_length == '0':
        if response.data:
            logger.info(f"Fixing missing content length: {len(response.data)}")
            response.headers['Content-Length'] = str(len(response.data))
        else:
            logger.warning("Response has no data")

    return response

@application.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files directly from static folder."""
    try:
        if not os.path.exists(os.path.join(static_folder, filename)):
            logger.warning(f"Static file not found: {filename}")
            return application.response_class(
                response="File not found",
                status=404
            )

        logger.info(f"Serving static file: {filename}")
        return send_from_directory(static_folder, filename)
    except Exception as e:
        logger.exception(f"Error serving static file {filename}: {e}")
        return application.response_class(
            response=f"Error serving file: {str(e)}",
            status=500
        )

@application.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve asset files from assets subdirectory."""
    try:
        assets_path = os.path.join(static_folder, 'assets')
        if not os.path.exists(assets_path):
            os.makedirs(assets_path, exist_ok=True)
            logger.info(f"Created assets directory: {assets_path}")

        if not os.path.exists(os.path.join(assets_path, filename)):
            logger.warning(f"Asset file not found: {filename}")
            return application.response_class(
                response="Asset not found",
                status=404
            )

        logger.info(f"Serving asset file: {filename}")
        return send_from_directory(assets_path, filename)
    except Exception as e:
        logger.exception(f"Error serving asset file {filename}: {e}")
        return application.response_class(
            response=f"Error serving asset: {str(e)}",
            status=500
        )

@application.route('/api/health')
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "message": "Health check passed"
    })

# Try to import the real application if possible
try:
    # First try importing directly from app module if it has create_app
    logger.info("Attempting to import create_app from app module")
    try:
        # Set environment variable to help create_app find the right static folder
        os.environ["RENDER"] = "true"
        from app import create_app
        logger.info("Found create_app in app module, initializing app")
        real_app = create_app()
        # Use the real app but keep our static folder handling
        real_app.static_folder = static_folder
        application = real_app
        logger.info("Successfully initialized app from create_app")
        logger.info(f"Final static_folder: {application.static_folder}")
    except (ImportError, AttributeError) as e:
        logger.warning(f"Could not import create_app from app: {e}")

        # Try importing from the root wsgi
        try:
            logger.info("Attempting to import from root wsgi.py")
            # First try to fix the common load_dotenv error
            try:
                # Check if config.py exists and needs patching
                if os.path.exists('config.py'):
                    with open('config.py', 'r') as f:
                        config_content = f.read()

                    # Check if load_dotenv is used but not imported
                    if 'load_dotenv()' in config_content and 'from dotenv import load_dotenv' not in config_content:
                        logger.info("Patching config.py to import load_dotenv")
                        with open('config.py', 'w') as f:
                            patched_content = "from dotenv import load_dotenv\n" + config_content
                            f.write(patched_content)
            except Exception as patch_err:
                logger.warning(f"Failed to patch config.py: {patch_err}")

            # Now try importing from wsgi
            from wsgi import application as real_app
            real_app.static_folder = static_folder
            application = real_app
            logger.info("Successfully imported real application from wsgi.py")
            logger.info(f"Final static_folder: {application.static_folder}")
        except Exception as wsgi_err:
            logger.warning(f"Could not import from wsgi.py: {wsgi_err}")

            # Try importing from app.py
            try:
                logger.info("Attempting to import from app.py")
                from app import app as real_app
                real_app.static_folder = static_folder
                application = real_app
                logger.info("Successfully imported from app.py")
                logger.info(f"Final static_folder: {application.static_folder}")
            except Exception as app_err:
                logger.warning(f"Could not import from app.py: {app_err}")
                logger.warning("Using standalone Flask application as fallback")
except Exception as e:
    logger.exception(f"Error during application import: {e}")
    logger.warning("Using standalone Flask application as fallback")

# Make the application available as 'app' as well (some WSGI servers use this name)
app = application

# Add a /debug route for troubleshooting
@app.route('/debug')
def debug_info():
    """Render debug information about the application."""
    if app.config.get('ENV') == 'production' and not os.environ.get('RENDER'):
        # Only allow debug in development or on Render
        return jsonify({"error": "Debug only available in development or on Render"})

    try:
        logger.info("Debug route called")
        # Debug template with detailed app info
        html_template = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Harmonic Universe - Debug</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2 {
                    color: #2c3e50;
                }
                pre {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 20px;
                }
                th, td {
                    text-align: left;
                    padding: 8px;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #f2f2f2;
                }
                .container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                }
                .back-btn {
                    display: inline-block;
                    background-color: #3498db;
                    color: white;
                    padding: 10px 15px;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                .back-btn:hover {
                    background-color: #2980b9;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Harmonic Universe - Debug Information</h1>

                <h2>Application</h2>
                <table>
                    <tr><th>App Name</th><td>{{ data.app_name }}</td></tr>
                    <tr><th>Mode</th><td>{{ data.mode }}</td></tr>
                    <tr><th>Timestamp</th><td>{{ data.timestamp }}</td></tr>
                    <tr><th>Hostname</th><td>{{ data.hostname }}</td></tr>
                    <tr><th>Static Folder</th><td>{{ data.static_folder }}</td></tr>
                </table>

                <h2>Environment</h2>
                <table>
                    <tr><th>Python Version</th><td>{{ data.python_version }}</td></tr>
                    <tr><th>Platform</th><td>{{ data.platform }}</td></tr>
                </table>

                <h2>Routes</h2>
                <pre>{{ data.routes|join('\n') }}</pre>

                <h2>Static Directory</h2>
                <table>
                    <tr><th>Static Path</th><td>{{ data.static_folder }}</td></tr>
                    <tr><th>Exists</th><td>{{ data.static_exists }}</td></tr>
                    <tr><th>Contents</th><td>{{ data.static_contents|join(', ') if data.static_contents else 'Empty' }}</td></tr>
                </table>

                <h2>Python Path</h2>
                <pre>{{ data.paths|join('\n') }}</pre>

                <h2>Environment Variables</h2>
                <table>
                    {% for key, value in data.env_vars.items() %}
                    <tr><th>{{ key }}</th><td>{{ value }}</td></tr>
                    {% endfor %}
                </table>

                <a href="/" class="back-btn">Back to Home</a>
            </div>
        </body>
        </html>
        """

        import datetime
        import platform
        import socket

        # Get static directory contents
        static_contents = []
        if hasattr(app, 'static_folder') and app.static_folder and os.path.exists(app.static_folder):
            try:
                static_contents = os.listdir(app.static_folder)
            except Exception as e:
                static_contents = [f"Error reading directory: {str(e)}"]

        debug_data = {
            "app_name": app.name,
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "paths": sys.path,
            "timestamp": datetime.datetime.now().isoformat(),
            "env_vars": {k: v for k, v in os.environ.items() if not k.startswith("SECRET") and not "KEY" in k.upper()},
            "routes": [str(rule) for rule in app.url_map.iter_rules()],
            "mode": "standalone" if app.name == 'app.wsgi' else "integrated",
            "hostname": socket.gethostname(),
            "static_folder": getattr(app, 'static_folder', 'None'),
            "static_exists": os.path.exists(getattr(app, 'static_folder', '')),
            "static_contents": static_contents
        }

        try:
            from flask import render_template_string
            # Render the template
            rendered_html = render_template_string(html_template, data=debug_data)

            # Explicitly set content type to HTML with content length
            response = app.response_class(
                response=rendered_html,
                status=200,
                mimetype='text/html',
                headers={
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Length': str(len(rendered_html))
                }
            )
            logger.info(f"Serving debug page with content length: {len(rendered_html)}")
            return response
        except Exception as e:
            logger.exception(f"Error rendering debug template: {e}")
            # Fallback to simple HTML
            fallback_html = f"""<!DOCTYPE html>
            <html>
            <head><title>Debug Info</title></head>
            <body>
                <h1>Debug Info</h1>
                <p>App: {app.name}</p>
                <p>Static Folder: {getattr(app, 'static_folder', 'None')}</p>
                <p>Error rendering full debug page: {str(e)}</p>
                <p><a href="/">Back to Home</a></p>
            </body>
            </html>"""

            # Explicitly set content type to HTML with content length
            response = app.response_class(
                response=fallback_html,
                status=200,
                mimetype='text/html',
                headers={
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Length': str(len(fallback_html))
                }
            )
            logger.info(f"Serving fallback debug page with content length: {len(fallback_html)}")
            return response
    except Exception as e:
        logger.exception(f"Unhandled error in debug route: {e}")
        error_html = f"""
        <html><body><h1>Error in Debug Route</h1><p>{str(e)}</p></body></html>
        """
        return app.response_class(
            response=error_html,
            status=500,
            mimetype='text/html',
            headers={
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': str(len(error_html))
            }
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Running application in development mode on port {port}")
    application.run(host="0.0.0.0", port=port, debug=True)
