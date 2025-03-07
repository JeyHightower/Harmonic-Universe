import os
import logging
import multiprocessing
import time
import shutil
from verify_static_directory import verify_static_directory

# Server socket configurations
bind = "0.0.0.0:10000"  # Make sure to bind to the port that's being checked
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"  # Using sync worker for Flask WSGI application

# Logging
loglevel = "info"
accesslog = "-"
errorlog = "-"

# Startup and shutdown
on_starting = verify_static_directory

# Timeout configurations
timeout = 120
keepalive = 5

# SSL Configuration (if needed)
keyfile = os.environ.get('SSL_KEYFILE', None)
certfile = os.environ.get('SSL_CERTFILE', None)

# Worker configurations
worker_tmp_dir = "/dev/shm"  # Use shared memory for worker temp files
max_requests = 1000
max_requests_jitter = 50

# Process naming
proc_name = "harmonic_universe"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# SSL
ssl_version = os.environ.get('SSL_VERSION', 'TLS')
cert_reqs = os.environ.get('SSL_CERT_REQS', 0)  # SSL_CERT_NONE

def verify_static_directory():
    """Verify static directory exists and is properly configured"""
    logger = logging.getLogger('gunicorn.error')
    static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')

    try:
        # Ensure directory exists
        os.makedirs(static_dir, exist_ok=True)
        os.chmod(static_dir, 0o755)
        logger.info(f"Static directory verified: {static_dir}")

        # Check contents
        contents = os.listdir(static_dir)
        logger.info(f"Static directory contents: {contents}")

        # Verify index.html
        index_path = os.path.join(static_dir, 'index.html')
        if os.path.exists(index_path):
            logger.info(f"index.html exists with permissions: {oct(os.stat(index_path).st_mode)[-3:]}")
        else:
            logger.error(f"index.html not found at {index_path}")
            return False

        # Copy frontend build files if they exist
        frontend_build = os.path.join('frontend', 'dist')
        if os.path.exists(frontend_build):
            logger.info(f"Found frontend build directory: {frontend_build}")
            for item in os.listdir(frontend_build):
                src = os.path.join(frontend_build, item)
                dst = os.path.join(static_dir, item)
                if os.path.isfile(src):
                    shutil.copy2(src, dst)
                elif os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
            logger.info("Copied frontend build files to static directory")

        return True
    except Exception as e:
        logger.error(f"Static directory verification failed: {e}")
        return False

def on_starting(server):
    """Prepare the application"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Initializing Harmonic Universe server')

    # Log environment
    logger.info(f"PYTHONPATH: {os.environ.get('PYTHONPATH')}")
    logger.info(f"VIRTUAL_ENV: {os.environ.get('VIRTUAL_ENV')}")
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Static directory: {os.environ.get('STATIC_DIR')}")

    # Verify static directory
    if not verify_static_directory():
        logger.error("Static directory verification failed")
        raise RuntimeError("Static directory verification failed")

def on_reload(server):
    """Handle server reload"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Reloading Harmonic Universe server')
    verify_static_directory()

def when_ready(server):
    """Log when server is ready"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Harmonic Universe server is ready')
    logger.info(f"Listening on {bind}")

    # Final verification of static files
    if not verify_static_directory():
        logger.error("Static directory verification failed after startup")

    # Wait a moment for everything to initialize
    time.sleep(2)

    # Verify we can connect to our own health endpoint
    try:
        import urllib.request
        health_url = f"http://localhost:10000/health"
        logger.info(f"Checking health endpoint: {health_url}")

        response = urllib.request.urlopen(health_url)
        if response.getcode() == 200:
            logger.info("Health check passed")
        else:
            logger.error(f"Health check failed with status: {response.getcode()}")

        # Log response content for debugging
        content = response.read().decode('utf-8')
        logger.info(f"Health check response: {content}")
    except Exception as e:
        logger.error(f"Error checking health endpoint: {e}")

def post_worker_init(worker):
    """Initialize worker processes"""
    logger = logging.getLogger('gunicorn.error')
    logger.info(f"Worker {worker.pid} initialized")
    verify_static_directory()

def worker_abort(worker):
    """Handle worker abort"""
    logger = logging.getLogger('gunicorn.error')
    logger.error(f"Worker {worker.pid} was aborted!")

def on_exit(server):
    """Clean up on exit"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Shutting down Harmonic Universe server')
