#!/usr/bin/env python
# Diagnostic script for Render deployment
import os
import sys
import shutil
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("render_diagnose")

def create_fallback_index():
    """Create a fallback index.html in all possible locations"""
    logger.info("Creating fallback index.html files in critical locations")

    # Template for the index.html file
    index_html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>This is an emergency fallback page created by render_diagnose.py.</p>
    <div id="diagnostic-info">
        <pre>Python version: {python_version}</pre>
        <pre>Current directory: {cwd}</pre>
        <pre>PYTHONPATH: {pythonpath}</pre>
        <pre>Environment: {env}</pre>
    </div>
</body>
</html>""".format(
        python_version=sys.version,
        cwd=os.getcwd(),
        pythonpath=sys.path,
        env=str({k: v for k, v in os.environ.items() if 'SECRET' not in k.upper()})
    )

    # Critical paths to try
    paths_to_try = [
        "./static",  # Relative to current directory
        "/opt/render/project/src/static",  # Absolute Render path
        os.path.join(os.getcwd(), "static"),  # Full path from current directory
        "/app/static",  # Another possible location
    ]

    # Create directories and index.html in all locations
    for path in paths_to_try:
        try:
            logger.info(f"Trying to create directory and index.html at {path}")
            os.makedirs(path, exist_ok=True)
            index_path = os.path.join(path, "index.html")

            with open(index_path, "w") as f:
                f.write(index_html_content)

            logger.info(f"Successfully created {index_path}")

            # Set permissive permissions
            try:
                os.chmod(index_path, 0o666)  # rw-rw-rw-
                logger.info(f"Set permissions on {index_path}")
            except Exception as e:
                logger.error(f"Error setting permissions on {index_path}: {e}")

        except Exception as e:
            logger.error(f"Failed to create index.html at {path}: {e}")

def show_filesystem_info():
    """Print information about the filesystem"""
    logger.info("Filesystem Information:")

    # Current directory
    logger.info(f"Current working directory: {os.getcwd()}")

    # List current directory
    try:
        logger.info(f"Contents of current directory: {os.listdir('.')}")
    except Exception as e:
        logger.error(f"Error listing current directory: {e}")

    # Check static directory
    static_paths = [
        "./static",
        "/opt/render/project/src/static",
        os.path.join(os.getcwd(), "static")
    ]

    for path in static_paths:
        try:
            if os.path.exists(path):
                logger.info(f"Static directory exists at {path}")
                logger.info(f"Contents of {path}: {os.listdir(path)}")

                # Check if index.html exists
                index_path = os.path.join(path, "index.html")
                if os.path.exists(index_path):
                    logger.info(f"index.html exists at {index_path}")
                    logger.info(f"index.html size: {os.path.getsize(index_path)} bytes")
                    logger.info(f"index.html permissions: {oct(os.stat(index_path).st_mode)}")
                else:
                    logger.warning(f"index.html does NOT exist at {index_path}")
            else:
                logger.warning(f"Static directory does NOT exist at {path}")
        except Exception as e:
            logger.error(f"Error checking static directory at {path}: {e}")

if __name__ == "__main__":
    logger.info("Starting Render diagnostic script")

    # Show environment and filesystem information
    show_filesystem_info()

    # Create fallback index.html files
    create_fallback_index()

    # Verify the results
    logger.info("Verifying results after creating fallback files:")
    show_filesystem_info()

    logger.info("Diagnostic script completed")
