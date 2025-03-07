import os
import multiprocessing
import logging

# Logging configuration
loglevel = 'debug'  # Changed to debug for more info
accesslog = '-'
errorlog = '-'
capture_output = True

# Worker configuration
workers = 4  # Fixed number instead of dynamic
worker_class = 'sync'  # Back to sync for reliability
timeout = 120  # Back to longer timeout
keepalive = 5

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Process naming
proc_name = 'harmonic-universe'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Logging configuration
logconfig_dict = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout'
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'gunicorn.error': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': True,
        },
        'gunicorn.access': {
            'level': 'INFO',
            'handlers': ['console'],
            'propagate': True,
        },
    }
}

def on_starting(server):
    """Log when the server starts and ensure static directory exists"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Starting Harmonic Universe server')

    # Ensure static directory exists
    static_dir = '/opt/render/project/src/static'
    if not os.path.exists(static_dir):
        os.makedirs(static_dir, exist_ok=True)
        os.chmod(static_dir, 0o755)
        logger.info(f"Created static directory: {static_dir}")

def post_worker_init(worker):
    """Log when a worker starts"""
    logger = logging.getLogger('gunicorn.error')
    logger.info(f'Worker {worker.pid} initialized')
