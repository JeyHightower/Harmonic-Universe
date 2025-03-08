#!/usr/bin/env python
# gunicorn.conf.py - Configuration file for gunicorn
import os
import sys
import logging
import subprocess
import importlib.util
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gunicorn.conf")

# Render-specific paths
RENDER_PROJECT_DIR = "/opt/render/project/src"
RENDER_STATIC_DIR = os.path.join(RENDER_PROJECT_DIR, "static")

# Gunicorn server configuration
bind = "0.0.0.0:{}".format(os.environ.get("PORT", "8000"))
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info")

def load_script(script_name):
    """
    Dynamically load a Python script file and return its module.
    This allows us to load and run scripts that might not be importable as modules.
    """
    try:
        # Try looking in the current directory first
        script_path = os.path.join(os.getcwd(), script_name)
        if not os.path.exists(script_path):
            logger.warning(f"Script {script_name} not found at {script_path}")

            # Check if there's a script with a similar name
            for filename in os.listdir(os.getcwd()):
                if script_name.lower() in filename.lower() and filename.endswith('.py'):
                    script_path = os.path.join(os.getcwd(), filename)
                    logger.info(f"Found similar script: {script_path}")
                    break
            else:
                logger.error(f"No similar script found for {script_name}")
                return None

        # Load the script as a module
        logger.info(f"Loading script from {script_path}")
        spec = importlib.util.spec_from_file_location("script_module", script_path)
        if spec is None:
            logger.error(f"Failed to create spec for {script_path}")
            return None

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        logger.info(f"Successfully loaded script as module: {script_path}")
        return module
    except Exception as e:
        logger.error(f"Error loading script {script_name}: {e}")
        return None

def ensure_static_directory():
    """
    Run the ensure_static_directory script to guarantee static files exist.
    This function tries multiple approaches to ensure the static directory
    and its contents are properly set up.
    """
    logger.info("Starting static directory verification...")

    # Approach 1: Try to import and run the ensure_static_directory.py script
    try:
        # First try to load the script as a module
        ensure_module = load_script("ensure_static_directory.py")
        if ensure_module and hasattr(ensure_module, 'ensure_static_directory'):
            logger.info("Running ensure_static_directory.py via module import")
            ensure_module.ensure_static_directory()
            return

        # If that fails, try running it as a subprocess
        if os.path.exists("ensure_static_directory.py"):
            logger.info("Running ensure_static_directory.py as subprocess")
            subprocess.run([sys.executable, "ensure_static_directory.py"], check=True)
            return
    except Exception as e:
        logger.error(f"Failed to run ensure_static_directory.py: {e}")

    # Approach 2: Try to load and run fix_static_files.py
    try:
        fix_module = load_script("fix_static_files.py")
        if fix_module and hasattr(fix_module, 'ensure_static_dirs'):
            logger.info("Running fix_static_files.py via module import")
            fix_module.ensure_static_dirs()
            return

        # If that fails, try running it as a subprocess
        if os.path.exists("fix_static_files.py"):
            logger.info("Running fix_static_files.py as subprocess")
            subprocess.run([sys.executable, "fix_static_files.py"], check=True)
            return
    except Exception as e:
        logger.error(f"Failed to run fix_static_files.py: {e}")

    # Approach 3: Directly create files as a last resort
    logger.info("Using built-in file creation as last resort")
    static_dirs = [
        RENDER_STATIC_DIR,
        os.path.join(os.getcwd(), "static"),
        os.path.join(os.getcwd(), "app/static")
    ]

    # Ensure all directories exist
    for static_dir in static_dirs:
        try:
            Path(static_dir).mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {static_dir}")
        except Exception as e:
            logger.error(f"Failed to create directory {static_dir}: {e}")

    # Create index.html in all directories
    index_html = """<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        div {
            text-align: center;
            padding: 2rem;
            border-radius: 10px;
            background: rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
        }
        a { color: white; }
    </style>
</head>
<body>
    <div>
        <h1>Harmonic Universe</h1>
        <p>Application is running. Created by gunicorn.conf.py</p>
        <p><a href="/api/health">Health Check</a></p>
    </div>
</body>
</html>"""

    for static_dir in static_dirs:
        try:
            if os.path.exists(static_dir):
                index_path = os.path.join(static_dir, "index.html")
                with open(index_path, "w") as f:
                    f.write(index_html)
                os.chmod(index_path, 0o644)
                logger.info(f"Created index.html at {index_path}")

                # Verify file exists and check contents
                contents = os.listdir(static_dir)
                logger.info(f"Directory contents of {static_dir}: {contents}")
        except Exception as e:
            logger.error(f"Error creating index.html in {static_dir}: {e}")

def on_starting(server):
    """Run when gunicorn starts"""
    logger.info(f"Starting gunicorn with {server.cfg.workers} workers")
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Directory contents: {os.listdir('.')}")

    # Run static directory setup
    ensure_static_directory()

    # Set environment variables
    os.environ["RENDER"] = "true"
    os.environ["STATIC_DIR"] = RENDER_STATIC_DIR

    # Load and run HTML fallback script
    try:
        # Try loading the HTML fallback script
        html_fallback = load_script("html_fallback.py")
        if html_fallback and hasattr(html_fallback, 'add_direct_html_routes'):
            # We'll apply this later in the post_fork hook
            logger.info("Successfully loaded HTML fallback script")
        else:
            logger.warning("Could not load HTML fallback script or it has no add_direct_html_routes function")
    except Exception as e:
        logger.error(f"Error loading HTML fallback script: {e}")

    logger.info("gunicorn startup setup completed")

def post_fork(server, worker):
    """
    Post-fork hook for Gunicorn workers.
    This is called after the worker has been forked but before it processes any requests.
    Use this to set up worker-specific features.
    """
    logger.info(f"Worker {worker.pid} forked")

    # Apply HTML fallback to the worker's application
    try:
        logger.info("Attempting to apply HTML fallback to worker application")

        # Load the HTML fallback script
        fallback_module = load_script("html_fallback.py")
        if fallback_module and hasattr(fallback_module, 'add_direct_html_routes'):
            # In Gunicorn, the application is accessible differently depending on worker type
            from flask import Flask

            # The wsgi app is accessed through the worker.app attribute in Gunicorn
            app = None

            # Try different ways to get the Flask application
            if hasattr(worker, 'app'):
                logger.info("Found app attribute in worker")
                app = worker.app
            elif hasattr(worker, 'wsgi_app'):
                logger.info("Found wsgi_app attribute in worker")
                app = worker.wsgi_app
            elif hasattr(server, 'app'):
                logger.info("Using server app")
                app = server.app

            # If we found the app object, we might need to extract the actual Flask application
            if app:
                # Unpack the app if it's a WSGI application
                if hasattr(app, 'application'):
                    logger.info("Extracting application from app")
                    app = app.application

                # If app is callable but not a Flask app, it might be a WSGI wrapper
                if callable(app) and not isinstance(app, Flask):
                    logger.info("App is callable but not a Flask app, trying to find Flask app")
                    # For some WSGI wrappers, we need to check their attributes
                    for attr_name in ['app', 'application', 'wsgi_app', 'flask_app']:
                        if hasattr(app, attr_name):
                            potential_app = getattr(app, attr_name)
                            if isinstance(potential_app, Flask):
                                logger.info(f"Found Flask app in {attr_name} attribute")
                                app = potential_app
                                break

            # Check if app is a Flask app or try to import it
            if app is None:
                logger.warning("Could not find app in worker, trying to import directly")
                try:
                    # Try to import the Flask app directly
                    import importlib
                    app_module = importlib.import_module('app.wsgi')
                    if hasattr(app_module, 'application'):
                        app = app_module.application
                        logger.info("Imported application from app.wsgi")
                    elif hasattr(app_module, 'app'):
                        app = app_module.app
                        logger.info("Imported app from app.wsgi")
                except Exception as import_err:
                    logger.warning(f"Failed to import app directly: {import_err}")

            # Check if we have a Flask app and apply the fallback
            if app and isinstance(app, Flask):
                logger.info(f"Found Flask application: {app.name}")

                # Add the direct HTML routes
                fallback_module.add_direct_html_routes(app)

                # Add middleware to ensure content-length is set
                @app.after_request
                def ensure_content_length(response):
                    """Ensure Content-Length header is set for all responses."""
                    if 'Content-Length' not in response.headers and response.data:
                        logger.info(f"Setting Content-Length: {len(response.data)} bytes")
                        response.headers['Content-Length'] = str(len(response.data))
                    return response

                logger.info("Successfully applied HTML fallback to worker application")
            else:
                logger.warning(f"Could not find Flask app or app is not a Flask instance: {type(app)}")
        else:
            logger.warning("HTML fallback module not found or missing add_direct_html_routes function")
    except Exception as e:
        logger.exception(f"Error applying HTML fallback to worker: {e}")

    logger.info(f"Worker {worker.pid} initialization completed")
