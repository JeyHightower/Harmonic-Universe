#!/usr/bin/env python
"""
Quick test script for static directory issues
Run this script on Render to diagnose static file problems
"""

import os
import sys
import logging
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_static_dir")

def create_test_file(path, content):
    """Create a test file at path with the given content"""
    try:
        with open(path, 'w') as f:
            f.write(content)
        logger.info(f"Successfully created test file at {path}")
    except Exception as e:
        logger.error(f"Failed to create test file at {path}: {str(e)}")
        logger.error(traceback.format_exc())

def test_static_directory():
    """Test static directory access and creation"""
    # Get current directory and Render project directory
    current_dir = os.getcwd()
    render_dir = "/opt/render/project/src"

    # Test paths
    test_paths = [
        os.path.join(current_dir, "static"),
        os.path.join(render_dir, "static"),
        os.path.join(current_dir, "app", "static"),
        os.path.join(render_dir, "app", "static"),
    ]

    # Test content
    test_content = """<!DOCTYPE html>
<html>
<head>
    <title>Static Directory Test</title>
</head>
<body>
    <h1>Static Directory Test</h1>
    <p>If you're seeing this, the test_static_dir.py script was able to create this file.</p>
    <p>Created at: {timestamp}</p>
</body>
</html>""".format(timestamp=__import__('datetime').datetime.now().isoformat())

    # Report environment
    logger.info(f"Current directory: {current_dir}")
    logger.info(f"Python executable: {sys.executable}")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Environment variables: {dict(os.environ)}")

    # Create directories and test files
    for dir_path in test_paths:
        try:
            # Create directory
            os.makedirs(dir_path, exist_ok=True)
            logger.info(f"Directory exists/created: {dir_path}")

            # List directory contents
            contents = os.listdir(dir_path)
            logger.info(f"Directory contents of {dir_path}: {contents}")

            # Create test file
            test_file_path = os.path.join(dir_path, "test_file.html")
            create_test_file(test_file_path, test_content)

            # Create index.html if it doesn't exist
            index_file_path = os.path.join(dir_path, "index.html")
            if not os.path.exists(index_file_path):
                create_test_file(index_file_path, test_content.replace("Static Directory Test", "Static Index Test"))
                logger.info(f"Created index.html at {index_file_path}")
            else:
                logger.info(f"index.html already exists at {index_file_path}")
        except Exception as e:
            logger.error(f"Error processing directory {dir_path}: {str(e)}")
            logger.error(traceback.format_exc())

    logger.info("Static directory test completed")

if __name__ == "__main__":
    logger.info("Starting static directory test")
    test_static_directory()
    logger.info("Test completed")
