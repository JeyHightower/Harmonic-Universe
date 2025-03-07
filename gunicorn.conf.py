import os
import logging
import multiprocessing

# Basic configuration
bind = "0.0.0.0:10000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
threads = 2
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
loglevel = 'info'
accesslog = '-'
errorlog = '-'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'
capture_output = True

# Process naming
proc_name = 'harmonic-universe'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None

def on_starting(server):
    """Prepare the application"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Initializing Harmonic Universe server')

    # Log environment
    logger.info(f"PYTHONPATH: {os.environ.get('PYTHONPATH')}")
    logger.info(f"VIRTUAL_ENV: {os.environ.get('VIRTUAL_ENV')}")
    logger.info(f"Current directory: {os.getcwd()}")

    # Ensure static directory exists
    static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
    try:
        os.makedirs(static_dir, exist_ok=True)
        os.chmod(static_dir, 0o755)
        logger.info(f"Ensured static directory exists: {static_dir}")

        # List contents
        if os.path.exists(static_dir):
            contents = os.listdir(static_dir)
            logger.info(f"Static directory contents: {contents}")
    except Exception as e:
        logger.error(f"Static directory setup failed: {e}")
        raise

def when_ready(server):
    """Log when server is ready"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Harmonic Universe server is ready')
    logger.info(f"Listening on {bind}")

    # Verify static files
    static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
    if os.path.exists(static_dir):
        logger.info(f"Static directory contents at startup: {os.listdir(static_dir)}")
    else:
        logger.error(f"Static directory missing at startup: {static_dir}")

def on_exit(server):
    """Clean up on exit"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Shutting down Harmonic Universe server')
