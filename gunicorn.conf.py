#!/usr/bin/env python
"""
Gunicorn configuration file for Harmonic Universe application.
Provides enhanced logging, worker management, and Flask app handling.
"""
import os
import sys
import importlib.util
import logging
import multiprocessing

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('gunicorn.conf')

# Ensure project directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Gunicorn config variables
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
workers = min(int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1)), 4)
timeout = int(os.environ.get('GUNICORN_TIMEOUT', 120))
keepalive = int(os.environ.get('GUNICORN_KEEPALIVE', 5))
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'sync')
loglevel = os.environ.get('LOG_LEVEL', 'info').lower()
accesslog = '-'  # Log to stdout
errorlog = '-'  # Log to stderr
capture_output = True
forwarded_allow_ips = '*'

logger.info(f"Gunicorn configuration: workers={workers}, timeout={timeout}, worker_class={worker_class}")

def import_flask_module(module_path):
    """
    Safely import a module that contains a Flask application.
    Returns the module if successful, None otherwise.
    """
    try:
        if ':' in module_path:
            module_name, object_name = module_path.split(':', 1)
        else:
            module_name, object_name = module_path, None

        logger.info(f"Attempting to import {module_name}")

        # Try standard import first
        try:
            module = importlib.import_module(module_name)
            logger.info(f"Successfully imported {module_name}")
            return module, object_name
        except ImportError as e:
            logger.warning(f"Standard import of {module_name} failed: {e}")

            # Try loading from file path
            if os.path.exists(f"{module_name}.py"):
                logger.info(f"Loading {module_name}.py from file")
                spec = importlib.util.spec_from_file_location(module_name, f"{module_name}.py")
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                logger.info(f"Successfully loaded {module_name} from file")
                return module, object_name

            logger.error(f"Failed to import {module_name} using any method")
            return None, None
    except Exception as e:
        logger.exception(f"Error importing Flask module {module_path}: {e}")
        return None, None

def extract_flask_app(module, app_name=None):
    """
    Extract a Flask application from a module.
    Checks for common patterns like application, app, create_app(), etc.
    """
    from flask import Flask

    if module is None:
        return None

    logger.info(f"Searching for Flask app in module {module.__name__}")

    # If app_name is specified, try to get that attribute directly
    if app_name and hasattr(module, app_name):
        obj = getattr(module, app_name)
        if isinstance(obj, Flask):
            logger.info(f"Found Flask app as {app_name} attribute")
            return obj
        elif callable(obj) and not isinstance(obj, type):
            try:
                logger.info(f"Found callable {app_name}, attempting to call it")
                result = obj()
                if isinstance(result, Flask):
                    logger.info(f"Successfully created Flask app by calling {app_name}()")
                    return result
            except Exception as e:
                logger.error(f"Error calling {app_name}: {e}")

    # Check common patterns
    for attr_name in ['application', 'app', 'flask_app', 'wsgi_app']:
        if hasattr(module, attr_name):
            obj = getattr(module, attr_name)
            if isinstance(obj, Flask):
                logger.info(f"Found Flask app as {attr_name} attribute")
                return obj

    # Check for factory functions
    if hasattr(module, 'create_app'):
        try:
            logger.info("Found create_app function, calling it")
            app = module.create_app()
            if isinstance(app, Flask):
                logger.info("Successfully created Flask app from create_app()")
                return app
        except Exception as e:
            logger.error(f"Error calling create_app: {e}")

    logger.warning(f"No Flask app found in module {module.__name__}")
    return None

def on_starting(server):
    """
    Hook that runs when Gunicorn starts.
    Set up application environment and verify configuration.
    """
    logger.info("Starting Gunicorn server for Harmonic Universe")

    # Ensure static directory exists
    static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
    if not os.path.exists(static_dir):
        try:
            os.makedirs(static_dir, exist_ok=True)
            logger.info(f"Created static directory: {static_dir}")
        except Exception as e:
            logger.error(f"Failed to create static directory: {e}")

    # Set Flask environment variables
    os.environ['FLASK_APP'] = os.environ.get('FLASK_APP', 'app')
    os.environ['FLASK_ENV'] = os.environ.get('APP_ENV', 'production')

    # Log key configuration info
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Python path: {sys.path}")
    logger.info(f"STATIC_DIR: {static_dir}")
    logger.info(f"FLASK_APP: {os.environ.get('FLASK_APP')}")

    logger.info("Gunicorn startup setup completed")

def post_fork(server, worker):
    """
    Post-fork hook for Gunicorn workers.
    This is called after the worker has been forked but before it processes any requests.
    """
    logger.info(f"Worker {worker.pid} forked")

    try:
        # Get the Flask application through worker __dict__ which is more reliable
        from flask import Flask, request

        # First try to import directly from app module
        try:
            logger.info("Importing app module directly")
            from app import create_app
            flask_app = create_app()
            logger.info(f"Successfully created Flask app via app.create_app(): {flask_app.name}")

            # Add response middleware directly to the Flask application
            @flask_app.after_request
            def ensure_content_length(response):
                """Ensure Content-Length header is set for all responses."""
                if hasattr(response, 'data') and response.data and 'Content-Length' not in response.headers:
                    response.headers['Content-Length'] = str(len(response.data))
                    logger.debug(f"Setting Content-Length: {len(response.data)} bytes")
                return response

            # Add request logging
            @flask_app.before_request
            def log_request():
                """Log basic request information."""
                logger.info(f"Request: {request.method} {request.path}")
                return None

            logger.info("Successfully patched Flask app with middleware")

            # Try to associate this Flask app with the worker if possible
            try:
                if hasattr(worker, 'wsgi'):
                    # Some workers have the wsgi attribute we can set
                    logger.info("Setting worker.wsgi to our Flask app")
                    worker.wsgi = flask_app
                elif hasattr(worker, 'app'):
                    # Some workers have an app attribute
                    logger.info("Setting worker.app to our Flask app")
                    worker.app = flask_app
                else:
                    logger.info("Worker doesn't have standard attributes to set Flask app")
            except Exception as e:
                logger.warning(f"Could not associate Flask app with worker: {e}")

            return

        except (ImportError, AttributeError) as e:
            logger.warning(f"Could not import app.create_app: {e}")

        # Try with the start_flask module as fallback
        try:
            logger.info("Trying start_flask.application")
            import start_flask
            if hasattr(start_flask, 'application'):
                flask_app = start_flask.application
                logger.info(f"Found Flask app in start_flask.application: {flask_app.name}")

                # Add middleware directly to this application
                @flask_app.after_request
                def ensure_content_length(response):
                    """Ensure Content-Length header is set for all responses."""
                    if hasattr(response, 'data') and response.data and 'Content-Length' not in response.headers:
                        response.headers['Content-Length'] = str(len(response.data))
                        logger.debug(f"Setting Content-Length: {len(response.data)} bytes")
                    return response

                logger.info("Successfully patched Flask app with middleware")
                return
        except (ImportError, AttributeError) as e:
            logger.warning(f"Could not import start_flask.application: {e}")

        # Try to patch the app via html_fallback script
        try:
            logger.info("Trying html_fallback.py as a last resort")
            import html_fallback
            from app.wsgi import application
            if html_fallback.add_direct_html_routes(application):
                logger.info("Successfully patched app through html_fallback")
                return
        except Exception as e:
            logger.warning(f"Failed to patch app through html_fallback: {e}")

        logger.warning("Could not find or patch any Flask application")
    except Exception as e:
        logger.exception(f"Error in post_fork hook: {e}")

    logger.info(f"Worker {worker.pid} initialization completed")

def worker_abort(worker):
    """Called when a worker is aborted."""
    logger.warning(f"Worker {worker.pid} aborted")

def worker_exit(server, worker):
    """Called when a worker exits."""
    logger.info(f"Worker {worker.pid} exited")
