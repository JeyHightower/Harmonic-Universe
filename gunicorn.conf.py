#!/usr/bin/env python
"""
Gunicorn configuration file.
This file contains settings for the Gunicorn WSGI server.
"""
import os
import logging
import multiprocessing

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
backlog = 2048

# Worker processes
workers = int(os.environ.get('WEB_CONCURRENCY', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
worker_connections = 1000
timeout = 60
keepalive = 2

# Server mechanics
daemon = False
raw_env = []
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Logging
errorlog = '-'
loglevel = 'info'
accesslog = '-'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = None

# Server hooks
def on_starting(server):
    """
    Called just before the master process is initialized.
    """
    logger.info("Gunicorn starting")

def on_reload(server):
    """
    Called before a worker is reloaded.
    """
    logger.info("Gunicorn reloading")

def when_ready(server):
    """
    Called just after the server is started.
    """
    logger.info("Gunicorn ready")

    # Load the HTML fallback script
    try:
        import html_fallback
        logger.info("HTML fallback script loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load HTML fallback script: {e}")

def post_fork(server, worker):
    """
    Called just after a worker has been forked.
    """
    logger.info(f"Worker forked (pid: {worker.pid})")

    # Apply HTML fallback to the worker's application
    try:
        from html_fallback import add_html_fallback_routes
        if hasattr(worker, 'wsgi') and hasattr(worker.wsgi, 'application'):
            logger.info("Applying HTML fallback to worker application")
            add_html_fallback_routes(worker.wsgi.application)
        else:
            logger.warning("Worker WSGI application not found, cannot apply HTML fallback")
    except Exception as e:
        logger.error(f"Failed to apply HTML fallback to worker: {e}")

def pre_fork(server, worker):
    """
    Called just before a worker is forked.
    """
    logger.info("Pre-forking worker")

def pre_exec(server):
    """
    Called just before a new master process is forked.
    """
    logger.info("Pre-exec hook")

def worker_int(worker):
    """
    Called when a worker receives SIGINT or SIGQUIT.
    """
    logger.info(f"Worker received INT or QUIT signal (pid: {worker.pid})")

def worker_abort(worker):
    """
    Called when a worker receives SIGABRT.
    """
    logger.info(f"Worker received ABORT signal (pid: {worker.pid})")

def worker_exit(server, worker):
    """
    Called just after a worker has exited.
    """
    logger.info(f"Worker exited (pid: {worker.pid})")

# Ensure static directory exists
def on_exit(server):
    """
    Called just before exiting Gunicorn.
    """
    logger.info("Gunicorn exiting")
