#!/usr/bin/env python
# Simple gunicorn configuration for Harmonic Universe

import os
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gunicorn.conf")

# General Gunicorn settings
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = 1
timeout = 120
worker_class = "sync"
loglevel = "info"

# Static folder setup
static_folder = os.environ.get('STATIC_FOLDER', '/opt/render/project/src/static')
local_static = os.path.abspath(os.path.join(os.path.dirname(__file__), 'static'))

def on_starting(server):
    """Log startup information and ensure directories exist."""
    logger.info("Starting Gunicorn server for Harmonic Universe")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Static folder: {static_folder}")

    # Ensure static folder exists
    for folder in [static_folder, local_static, 'app/static']:
        try:
            os.makedirs(folder, exist_ok=True)
            logger.info(f"Ensured static folder exists: {folder}")
        except Exception as e:
            logger.error(f"Failed to create static folder {folder}: {e}")

def on_exit(server):
    """Log shutdown information."""
    logger.info("Shutting down Gunicorn server")
