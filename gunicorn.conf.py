import os
import logging

# Basic configuration
bind = "0.0.0.0:10000"
workers = 4
worker_class = 'sync'
preload_app = True
timeout = 120

# Logging
loglevel = 'info'
accesslog = '-'
errorlog = '-'
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

    # Ensure static directory exists
    static_dir = '/opt/render/project/src/static'
    if not os.path.exists(static_dir):
        os.makedirs(static_dir, exist_ok=True)
        os.chmod(static_dir, 0o755)
        logger.info(f"Created static directory: {static_dir}")

def when_ready(server):
    """Log when server is ready"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Harmonic Universe server is ready')
