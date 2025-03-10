import os
import logging

def verify_static_directory():
    """Verify static directory exists and is properly configured"""
    logger = logging.getLogger('gunicorn.error')
    static_dir = os.environ.get('STATIC_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static'))

    try:
        # Ensure directory exists
        os.makedirs(static_dir, exist_ok=True)
        os.chmod(static_dir, 0o755)  # Ensure proper permissions

        # Check contents
        contents = os.listdir(static_dir)
        logger.info(f"Static directory contents: {contents}")

        # Verify index.html
        index_path = os.path.join(static_dir, 'index.html')
        if os.path.exists(index_path):
            # Ensure file is readable
            os.chmod(index_path, 0o644)
            logger.info(f"index.html exists with permissions: {oct(os.stat(index_path).st_mode)[-3:]}")
        else:
            logger.error(f"index.html not found at {index_path}")
            return False

        # Check all files in static directory are readable
        for file in contents:
            file_path = os.path.join(static_dir, file)
            if os.path.isfile(file_path):
                os.chmod(file_path, 0o644)

        return True
    except Exception as e:
        logger.error(f"Static directory verification failed: {e}")
        return False
