#!/usr/bin/env python
"""
Standalone WSGI application for Render.com.
This file creates a basic Flask application that can run independently.
"""
import os
import sys
import logging
from flask import Flask, jsonify, send_from_directory, render_template_string

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Starting standalone app.wsgi module")

# Create a basic Flask application
application = Flask(__name__)

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to sys.path")

# Configure static folder
static_folder = os.environ.get('STATIC_DIR', os.path.join(current_dir, 'static'))
application.static_folder = static_folder
logger.info(f"Using static folder: {static_folder}")

# Print the Python path for debugging
logger.info(f"Python path: {sys.path}")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Directory contents: {os.listdir('.')}")
if os.path.exists('app'):
    logger.info(f"App directory contents: {os.listdir('app')}")

# Check if static directory exists and has content
if os.path.exists(static_folder):
    logger.info(f"Static directory contents: {os.listdir(static_folder)}")

    # Verify index.html exists
    index_path = os.path.join(static_folder, 'index.html')
    if not os.path.exists(index_path):
        logger.error(f"index.html not found at {index_path}")

        # Create a default index.html if it doesn't exist
        try:
            os.makedirs(static_folder, exist_ok=True)
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
else:
    logger.warning(f"Static directory not found: {static_folder}")
    try:
        os.makedirs(static_folder, exist_ok=True)
        logger.info(f"Created static directory: {static_folder}")
    except Exception as e:
        logger.error(f"Failed to create static directory: {e}")

# Basic routes for health check
@application.route('/')
def home():
    """Serve the home page."""
    index_path = os.path.join(static_folder, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            html_content = f.read()
        return html_content
    return jsonify({
        "status": "ok",
        "message": "Harmonic Universe application is running in standalone mode"
    })

@application.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files."""
    return send_from_directory(static_folder, filename)

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
        from app import create_app
        logger.info("Found create_app in app module, initializing app")
        real_app = create_app()
        application = real_app
        logger.info("Successfully initialized app from create_app")
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
            application = real_app
            logger.info("Successfully imported real application from wsgi.py")
        except Exception as wsgi_err:
            logger.warning(f"Could not import from wsgi.py: {wsgi_err}")

            # Try importing from app.py
            try:
                logger.info("Attempting to import from app.py")
                from app import app as real_app
                application = real_app
                logger.info("Successfully imported from app.py")
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
    """Debug info endpoint."""
    import platform
    import datetime
    import socket

    # Only add this route if it doesn't already exist
    if app.name == 'app.wsgi' or '/debug' not in [rule.rule for rule in app.url_map.iter_rules()]:
        # Convert to a pretty HTML response
        html_template = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Harmonic Universe - Debug Info</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1 { color: #4CAF50; }
                h2 { color: #2196F3; margin-top: 30px; }
                pre {
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                .container {
                    background-color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                td, th {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                .back-btn {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
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
                </table>

                <h2>Environment</h2>
                <table>
                    <tr><th>Python Version</th><td>{{ data.python_version }}</td></tr>
                    <tr><th>Platform</th><td>{{ data.platform }}</td></tr>
                </table>

                <h2>Routes</h2>
                <pre>{{ data.routes|join('\n') }}</pre>

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

        debug_data = {
            "app_name": app.name,
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "paths": sys.path,
            "timestamp": datetime.datetime.now().isoformat(),
            "env_vars": {k: v for k, v in os.environ.items() if not k.startswith("SECRET") and not "KEY" in k.upper()},
            "routes": [str(rule) for rule in app.url_map.iter_rules()],
            "mode": "standalone" if app.name == 'app.wsgi' else "integrated",
            "hostname": socket.gethostname()
        }

        return render_template_string(html_template, data=debug_data)

    return jsonify({"error": "Not available in integrated mode"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Running application in development mode on port {port}")
    application.run(host="0.0.0.0", port=port, debug=True)
