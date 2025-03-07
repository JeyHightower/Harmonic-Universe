#!/usr/bin/env python
"""
Python Path Configuration Script

This script sets up the Python import paths for the application.
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("setup_path")

def setup_import_paths():
    """Set up the import paths for the application."""
    # Get the absolute path of the project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Add the project root to the Python path if it's not already there
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
        logger.info(f"Added {project_root} to Python path")

    # Add the current directory to the Python path if it's not already there
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
        logger.info(f"Added {current_dir} to Python path")

    # If there's a 'backend' directory, add it to the path
    backend_dir = os.path.join(project_root, 'backend')
    if os.path.exists(backend_dir) and backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
        logger.info(f"Added {backend_dir} to Python path")

    # If application is run from within backend, adjust paths
    if os.path.basename(current_dir) == 'backend':
        # Add the parent directory to the path
        parent_dir = os.path.dirname(current_dir)
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
            logger.info(f"Added {parent_dir} to Python path")

    logger.info(f"Python path: {sys.path}")

if __name__ == "__main__":
    setup_import_paths()
