#!/usr/bin/env python
# This script creates symbolic links to ensure static files are accessible
# in all possible locations where Flask/Render might look for them

import os
import sys
import shutil
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("static_symlink")

def create_static_symlinks():
    """Create symbolic links between various static directories to ensure
    files are accessible from all locations."""

    # Get the current working directory and potential static directories
    cwd = os.getcwd()

    # List of potential static directories
    static_dirs = [
        os.path.join(cwd, "static"),  # ./static
        "/opt/render/project/src/static",  # Render-specific path
        os.path.join(cwd, "app", "static"),  # ./app/static
        os.path.join(cwd, "backend", "static"),  # ./backend/static
    ]

    # Create a minimal index.html if none exists
    minimal_index_html = """<!DOCTYPE html>
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
    <p>This page was created by the app_static_symlink.py script.</p>
</body>
</html>"""

    # First, ensure all directories exist
    for static_dir in static_dirs:
        try:
            os.makedirs(static_dir, exist_ok=True)
            logger.info(f"Ensured directory exists: {static_dir}")
        except Exception as e:
            logger.error(f"Error creating directory {static_dir}: {e}")

    # Check if any static directory has index.html
    index_html_found = False
    source_index_html = None

    for static_dir in static_dirs:
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            logger.info(f"Found existing index.html at {index_path}")
            index_html_found = True
            source_index_html = index_path
            break

    # If no index.html found, create one in the primary location
    if not index_html_found:
        primary_index_path = os.path.join(static_dirs[0], "index.html")
        try:
            logger.info(f"Creating index.html at {primary_index_path}")
            with open(primary_index_path, "w") as f:
                f.write(minimal_index_html)
            source_index_html = primary_index_path
        except Exception as e:
            logger.error(f"Error creating index.html: {e}")

    # If we have a source file, make sure it exists in all locations
    if source_index_html:
        for static_dir in static_dirs:
            target_index_path = os.path.join(static_dir, "index.html")

            if target_index_path != source_index_html and not os.path.exists(target_index_path):
                try:
                    # Copy the file instead of symlinking (which might not work in all environments)
                    shutil.copy2(source_index_html, target_index_path)
                    logger.info(f"Copied index.html to {target_index_path}")
                except Exception as e:
                    logger.error(f"Error copying index.html to {target_index_path}: {e}")

    # Verify all locations have index.html
    for static_dir in static_dirs:
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            logger.info(f"Verified index.html exists at {index_path}")
        else:
            logger.warning(f"index.html NOT found at {index_path}")

if __name__ == "__main__":
    logger.info("Starting static symlink script")
    create_static_symlinks()
    logger.info("Static symlink script completed")
