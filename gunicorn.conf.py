import os
import logging
import multiprocessing

# Server socket configurations
bind = "0.0.0.0:10000"  # Ensure we're binding to port 10000
workers = 2
worker_class = "sync"  # Using the simpler sync worker for reliability

# Logging
loglevel = "info"
accesslog = "-"
errorlog = "-"

# Timeout configurations
timeout = 120
keepalive = 5

def verify_static_directory():
    """Verify static directory exists and is properly configured"""
    logger = logging.getLogger('gunicorn.error')
    static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')

    try:
        # Ensure directory exists
        os.makedirs(static_dir, exist_ok=True)
        os.chmod(static_dir, 0o755)

        # Check contents
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
                f.write("<html><body><h1>Hello World!</h1></body></html>")
            os.chmod(index_path, 0o666)
            logger.info("Created default index.html")

        return True
    except Exception as e:
        logger.error(f"Static directory verification failed: {e}")
        return False

def on_starting(server):
    """Run before the server starts."""
    verify_static_directory()
