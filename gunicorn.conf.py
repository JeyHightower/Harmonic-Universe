import os
import multiprocessing
import logging

# Logging configuration
loglevel = 'info'
accesslog = '-'  # stdout
errorlog = '-'   # stderr
capture_output = True

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'gevent'  # Changed from sync for better performance
threads = 4
worker_connections = 1000
timeout = 30  # Reduced from 120
keepalive = 2

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

# Reload settings
reload = True
reload_engine = 'auto'

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
            'level': 'INFO',
        },
        'gunicorn.error': {
            'level': 'INFO',
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
    """Log when the server starts"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Starting Harmonic Universe server')

def on_reload(server):
    """Log when the server reloads"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Reloading Harmonic Universe server')

def when_ready(server):
    """Log when server is ready"""
    logger = logging.getLogger('gunicorn.error')
    logger.info('Harmonic Universe server is ready to accept connections')
