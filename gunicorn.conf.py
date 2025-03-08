#!/usr/bin/env python
# gunicorn.conf.py
import os
import sys
import logging
import multiprocessing

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gunicorn.conf")

# Get Render-specific paths
RENDER_PROJECT_DIR = "/opt/render/project/src"
RENDER_STATIC_DIR = os.path.join(RENDER_PROJECT_DIR, "static")

# Server socket configurations
bind = "0.0.0.0:{}".format(os.environ.get("PORT", "8000"))
workers = os.environ.get("WEB_CONCURRENCY", 2)
worker_class = "sync"  # Using the simpler sync worker for reliability

# Logging
loglevel = os.environ.get("LOG_LEVEL", "info")
accesslog = "-"
errorlog = "-"

# Timeout configurations
timeout = 120
keepalive = 5

def verify_static_directory():
    """Verify and if needed create the static directory and index.html"""
    try:
        # Check for multiple possible static directories in order of preference
        possible_static_dirs = [
            RENDER_STATIC_DIR,                                 # Render absolute path
            os.path.join(os.getcwd(), "static"),               # Project root static
            os.path.join(os.path.dirname(__file__), "static"), # Relative to this file
            os.path.join(os.getcwd(), "app", "static"),        # App module static
        ]

        # Find the first existing static directory or use the Render path
        static_dir = None
        for path in possible_static_dirs:
            if os.path.exists(path):
                static_dir = path
                logger.info(f"Found static directory at: {static_dir}")
                break

        # If no static dir exists, create the Render one
        if not static_dir:
            static_dir = RENDER_STATIC_DIR
            os.makedirs(static_dir, exist_ok=True)
            logger.info(f"Created static directory at: {static_dir}")

        # Create symlinks for better compatibility
        try:
            local_static = os.path.join(os.getcwd(), "static")
            if not os.path.exists(local_static):
                os.symlink(static_dir, local_static)
                logger.info(f"Created symlink from {static_dir} to {local_static}")
        except Exception as symlink_error:
            logger.warning(f"Failed to create symlink: {symlink_error}")

        # Check contents of static directory
        contents = os.listdir(static_dir)
        logger.info(f"Static directory contents: {contents}")

        # Verify index.html
        index_path = os.path.join(static_dir, 'index.html')
        if os.path.exists(index_path):
            # Ensure file is readable by all
            os.chmod(index_path, 0o666)
            logger.info(f"index.html exists with permissions: {oct(os.stat(index_path).st_mode)[-3:]}")
        else:
            logger.error(f"index.html not found at {index_path}")
            with open(index_path, 'w') as f:
                f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        p {
            margin-bottom: 1.5rem;
        }
    </style>
</head>
<body>
    <div>
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe platform. The application is running successfully!</p>
        <p><a href="/api/health" style="color: white;">Health Check</a> | <a href="/debug" style="color: white;">Debug Info</a></p>
    </div>
</body>
</html>""")
            os.chmod(index_path, 0o666)
            logger.info("Created default index.html")

        return True
    except Exception as e:
        logger.error(f"Static directory verification failed: {e}")
        return False

def on_starting(server):
    """Run when Gunicorn starts"""
    logger.info("Starting Gunicorn with configuration:")
    logger.info(f"Workers: {server.cfg.workers}")
    logger.info(f"Bind: {server.cfg.bind}")

    # Verify static directory setup
    verify_static_directory()

    # Set environment variable for Render deployment
    os.environ["RENDER"] = "true"

    # Set static directory environment variable
    os.environ["STATIC_DIR"] = RENDER_STATIC_DIR
