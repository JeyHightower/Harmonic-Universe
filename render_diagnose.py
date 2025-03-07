#!/usr/bin/env python
"""
Comprehensive diagnostic script for Render deployment
This script checks for common deployment issues and logs detailed information
"""
import os
import sys
import logging
import importlib
import inspect
import traceback
import socket
import json
import urllib.request
import urllib.error
import platform
import subprocess
import time
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger("render_diagnose")

def check_environment():
    """Check environment variables and system information"""
    logger.info("=== Environment Information ===")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Platform: {platform.platform()}")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"User: {os.getenv('USER')}")
    logger.info(f"PYTHONPATH: {os.getenv('PYTHONPATH', 'Not set')}")
    logger.info(f"STATIC_DIR: {os.getenv('STATIC_DIR', 'Not set')}")
    logger.info(f"PORT: {os.getenv('PORT', 'Not set')}")
    logger.info(f"FLASK_APP: {os.getenv('FLASK_APP', 'Not set')}")
    logger.info(f"FLASK_ENV: {os.getenv('FLASK_ENV', 'Not set')}")

    # Check if we're running in a virtual environment
    logger.info(f"Virtual env: {os.getenv('VIRTUAL_ENV', 'Not in virtual env')}")

    # Try to get IP address
    try:
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        logger.info(f"Hostname: {hostname}, IP: {ip}")
    except Exception as e:
        logger.error(f"Error getting network info: {e}")

def check_directories():
    """Check important directories and permissions"""
    logger.info("=== Directory Information ===")

    # Current directory
    cwd = os.getcwd()
    logger.info(f"Contents of current directory: {os.listdir(cwd)}")

    # Check static directory
    static_dir = os.getenv('STATIC_DIR', os.path.join(cwd, 'static'))
    if os.path.exists(static_dir):
        logger.info(f"Static directory exists at {static_dir}")
        try:
            contents = os.listdir(static_dir)
            logger.info(f"Contents of static directory: {contents}")

            # Check index.html specifically
            index_path = os.path.join(static_dir, 'index.html')
            if os.path.exists(index_path):
                logger.info(f"index.html exists in static directory")
                logger.info(f"Size: {os.path.getsize(index_path)} bytes")
                logger.info(f"Permissions: {oct(os.stat(index_path).st_mode)}")

                # Try to create a test file to check write permissions
                try:
                    test_file = os.path.join(static_dir, 'test_write.txt')
                    with open(test_file, 'w') as f:
                        f.write("Test write permission")
                    logger.info(f"Successfully wrote test file to static directory")
                    # Clean up
                    os.remove(test_file)
                except Exception as e:
                    logger.error(f"Failed to write to static directory: {e}")
            else:
                logger.error(f"index.html not found in static directory")
        except Exception as e:
            logger.error(f"Error checking static directory: {e}")
    else:
        logger.error(f"Static directory does not exist at {static_dir}")

    # Also check Render-specific path
    render_static = "/opt/render/project/src/static"
    if render_static != static_dir and os.path.exists(render_static):
        logger.info(f"Render static directory exists at {render_static}")
        try:
            contents = os.listdir(render_static)
            logger.info(f"Contents of Render static directory: {contents}")

            # Check if it's a symlink
            if os.path.islink(render_static):
                target = os.readlink(render_static)
                logger.info(f"Render static directory is a symlink to {target}")
        except Exception as e:
            logger.error(f"Error checking Render static directory: {e}")
    elif render_static != static_dir:
        logger.error(f"Render static directory does not exist at {render_static}")

def check_modules():
    """Check if required modules are importable"""
    logger.info("=== Module Checks ===")

    # Try to import common dependencies
    modules_to_check = [
        'flask', 'sqlalchemy', 'flask_sqlalchemy', 'gunicorn',
        'werkzeug', 'jinja2', 'itsdangerous'
    ]

    for module_name in modules_to_check:
        try:
            module = importlib.import_module(module_name)
            version = getattr(module, '__version__', 'Unknown')
            logger.info(f"✅ {module_name} is available (version: {version})")
        except ImportError as e:
            logger.error(f"❌ {module_name} is not available: {e}")

    # Try to import app
    try:
        import app
        logger.info("✅ app module can be imported")

        # Check for Flask app instance
        if hasattr(app, 'app'):
            logger.info("✅ app.app exists")
            try:
                routes = list(app.app.url_map.iter_rules())
                logger.info(f"Routes: {routes}")

                # Check specifically for health routes
                health_routes = [r for r in routes if 'health' in str(r)]
                if health_routes:
                    logger.info(f"✅ Health routes found: {health_routes}")
                else:
                    logger.error("❌ No health routes found")
            except Exception as e:
                logger.error(f"❌ Error checking routes: {e}")
        else:
            logger.error("❌ app.app does not exist")

        # Check for create_app function
        if hasattr(app, 'create_app'):
            logger.info("✅ create_app function exists")
            try:
                test_app = app.create_app()
                logger.info("✅ create_app() executes successfully")
            except Exception as e:
                logger.error(f"❌ Error executing create_app(): {e}")

    except ImportError as e:
        logger.error(f"❌ app module cannot be imported: {e}")
    except Exception as e:
        logger.error(f"❌ Error checking app module: {e}")
        traceback.print_exc()

def check_network():
    """Check network connectivity and health endpoint"""
    logger.info("=== Network Checks ===")

    # First create temporary health check app
    port = int(os.getenv('PORT', 10000))
    health_port = port + 1  # Use a different port

    # Define URLs to check
    urls_to_check = [
        f"http://localhost:{port}/",
        f"http://localhost:{port}/health",
        f"http://localhost:{port}/api/health",
        f"http://127.0.0.1:{port}/",
        f"http://127.0.0.1:{port}/health",
        f"http://127.0.0.1:{port}/api/health",
    ]

    # Also add current machine's IP
    try:
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        urls_to_check.extend([
            f"http://{ip}:{port}/",
            f"http://{ip}:{port}/health",
            f"http://{ip}:{port}/api/health",
        ])
    except Exception as e:
        logger.error(f"Error getting network info: {e}")

    # Check each URL
    for url in urls_to_check:
        try:
            logger.info(f"Checking URL: {url}")
            response = urllib.request.urlopen(url, timeout=3)
            status = response.getcode()
            content = response.read().decode('utf-8')
            logger.info(f"✅ URL {url} returned status {status}")
            logger.info(f"Content: {content[:100]}...")  # Show first 100 chars
        except urllib.error.URLError as e:
            logger.error(f"❌ Failed to connect to {url}: {e}")
        except Exception as e:
            logger.error(f"❌ Error checking {url}: {e}")

def create_fallback_files():
    """Try to create fallback static and health files in various locations"""
    logger.info("=== Creating Fallback Files ===")

    # Locations to try
    locations = [
        os.path.join(os.getcwd(), 'static'),
        '/opt/render/project/src/static',
        '/app/static'  # Another common location
    ]

    for location in locations:
        logger.info(f"Trying to create directory and index.html at {location}")
        try:
            os.makedirs(location, exist_ok=True)
            index_path = os.path.join(location, 'index.html')
            with open(index_path, 'w') as f:
                f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div id="root">
        <h1>Harmonic Universe is running</h1>
        <p>If you see this message, static files are being served correctly.</p>
        <p>Created by fallback mechanism at: """ + time.strftime("%Y-%m-%d %H:%M:%S") + """</p>
    </div>
</body>
</html>
""")
            os.chmod(index_path, 0o666)  # Make readable by everyone
            logger.info(f"Successfully created {index_path}")
            logger.info(f"Set permissions on {index_path}")
        except Exception as e:
            logger.error(f"Failed to create index.html at {location}: {e}")

def create_standalone_health_check():
    """Create a standalone health check script that can be run separately"""
    logger.info("=== Creating Standalone Health Check ===")

    health_script = """#!/usr/bin/env python
import os
import sys
import logging
from flask import Flask, jsonify
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("health_check_standalone")

# Create app
app = Flask(__name__)

@app.route('/health')
@app.route('/api/health')
def health():
    logger.info("Health check endpoint called")
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'Standalone health check is working'
    })

@app.route('/')
def root():
    return "Standalone health check server is running"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    logger.info(f"Starting standalone health check on port {port}")
    app.run(host='0.0.0.0', port=port)
"""

    try:
        with open('standalone_health.py', 'w') as f:
            f.write(health_script)
        os.chmod('standalone_health.py', 0o755)  # Make executable
        logger.info("Created standalone health check script at standalone_health.py")
    except Exception as e:
        logger.error(f"Failed to create standalone health check: {e}")

def verify_results():
    """Verify the results after creating fallback files"""
    logger.info("=== Verifying results after creating fallback files: ===")

    # Check filesystem information
    logger.info("Filesystem Information:")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Contents of current directory: {os.listdir(os.getcwd())}")

    # Check static directory
    static_dir = os.path.join(os.getcwd(), 'static')
    if os.path.exists(static_dir):
        logger.info(f"Static directory exists at {static_dir}")
        logger.info(f"Contents of {static_dir}: {os.listdir(static_dir)}")

        # Check index.html
        index_path = os.path.join(static_dir, 'index.html')
        if os.path.exists(index_path):
            logger.info(f"index.html exists at {index_path}")
            logger.info(f"index.html size: {os.path.getsize(index_path)} bytes")
            logger.info(f"index.html permissions: {oct(os.stat(index_path).st_mode)}")
        else:
            logger.error(f"index.html does not exist at {index_path}")
    else:
        logger.error(f"Static directory does not exist at {static_dir}")

    # Check Render static directory
    render_static = "/opt/render/project/src/static"
    if os.path.exists(render_static):
        logger.info(f"Static directory exists at {render_static}")
        logger.info(f"Contents of {render_static}: {os.listdir(render_static)}")

        # Check index.html
        index_path = os.path.join(render_static, 'index.html')
        if os.path.exists(index_path):
            logger.info(f"index.html exists at {index_path}")
            logger.info(f"index.html size: {os.path.getsize(index_path)} bytes")
            logger.info(f"index.html permissions: {oct(os.stat(index_path).st_mode)}")
        else:
            logger.error(f"index.html does not exist at {index_path}")
    else:
        logger.error(f"Static directory does not exist at {render_static}")

    # Check another common location
    app_static = "/app/static"
    if os.path.exists(app_static):
        logger.info(f"Static directory exists at {app_static}")
        logger.info(f"Contents of {app_static}: {os.listdir(app_static)}")
    else:
        logger.error(f"Static directory does not exist at {app_static}")

def main():
    """Main function to run all diagnostic checks"""
    logger.info("Starting diagnostic script")

    try:
        check_environment()
        check_directories()
        check_modules()
        create_fallback_files()
        create_standalone_health_check()
        verify_results()

        # Network checks at the end as they might hang
        check_network()

    except Exception as e:
        logger.error(f"Diagnostic script error: {e}")
        traceback.print_exc()

    logger.info("Diagnostic script completed")

if __name__ == "__main__":
    main()
