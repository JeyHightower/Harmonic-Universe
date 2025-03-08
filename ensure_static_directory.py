#!/usr/bin/env python
"""
Script to ensure the static directory exists and contains the required files.
This script is designed to run as part of the gunicorn startup process.
"""
import os
import sys
import logging
import stat
import shutil
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ensure_static_directory")

def ensure_static_directory():
    """
    Ensure the static directory exists and contains the index.html file.
    Also check permissions and file content to diagnose serving issues.
    """
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    logger.info(f"Current directory: {current_dir}")

    # Define paths
    static_dir = os.path.join(current_dir, 'static')
    app_static_dir = os.path.join(current_dir, 'app', 'static')
    index_path = os.path.join(static_dir, 'index.html')

    # Check if static directory exists
    if not os.path.exists(static_dir):
        logger.warning(f"Static directory does not exist at {static_dir}. Creating it now.")
        os.makedirs(static_dir, exist_ok=True)
    else:
        logger.info(f"Static directory exists at {static_dir}")
        # Check permissions
        st = os.stat(static_dir)
        permissions = stat.filemode(st.st_mode)
        logger.info(f"Static directory permissions: {permissions}")

    # Check if app/static directory exists
    if not os.path.exists(app_static_dir):
        logger.warning(f"App static directory does not exist at {app_static_dir}. Creating it now.")
        os.makedirs(app_static_dir, exist_ok=True)
    else:
        logger.info(f"App static directory exists at {app_static_dir}")
        # Check permissions
        st = os.stat(app_static_dir)
        permissions = stat.filemode(st.st_mode)
        logger.info(f"App static directory permissions: {permissions}")

    # Check if index.html exists in static directory
    if not os.path.exists(index_path):
        logger.warning(f"index.html does not exist at {index_path}. Creating a minimal version.")
        with open(index_path, 'w') as f:
            f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
            color: white;
            height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 20px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .button-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .button-primary {
            background-color: #4CAF50;
            color: white;
        }
        .button-secondary {
            background-color: #2196F3;
            color: white;
        }
        .button-tertiary {
            background-color: #FFC107;
            color: black;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Harmonic Universe</h1>
        <p>Explore the fascinating connection between music and physics.</p>
        <div class="button-container">
            <a href="/login" class="button button-primary">Login</a>
            <a href="/register" class="button button-secondary">Sign Up</a>
            <a href="/demo" class="button button-tertiary">Try Demo</a>
            <a href="/api/health" class="button button-primary">Health Check</a>
        </div>
    </div>
</body>
</html>""")
    else:
        logger.info(f"index.html exists at {index_path}")
        # Check file size
        file_size = os.path.getsize(index_path)
        logger.info(f"index.html file size: {file_size} bytes")

        # Check permissions
        st = os.stat(index_path)
        permissions = stat.filemode(st.st_mode)
        logger.info(f"index.html permissions: {permissions}")

        # Check content (first few lines)
        try:
            with open(index_path, 'r') as f:
                first_lines = ''.join([next(f) for _ in range(5)])
            logger.info(f"First few lines of index.html:\n{first_lines}...")
        except Exception as e:
            logger.error(f"Error reading index.html: {e}")

    # Create a symlink from app/static to static if it doesn't exist
    app_static_index = os.path.join(app_static_dir, 'index.html')
    if not os.path.exists(app_static_index):
        try:
            # Copy index.html to app/static directory
            shutil.copy2(index_path, app_static_index)
            logger.info(f"Copied index.html to {app_static_index}")
        except Exception as e:
            logger.error(f"Error copying index.html to app/static: {e}")
    else:
        logger.info(f"index.html exists in app/static directory at {app_static_index}")
        # Check file size
        file_size = os.path.getsize(app_static_index)
        logger.info(f"app/static/index.html file size: {file_size} bytes")

    # List all files in static directory
    logger.info("Files in static directory:")
    for file in os.listdir(static_dir):
        file_path = os.path.join(static_dir, file)
        file_size = os.path.getsize(file_path)
        logger.info(f"  - {file} ({file_size} bytes)")

    # List all files in app/static directory
    logger.info("Files in app/static directory:")
    for file in os.listdir(app_static_dir):
        file_path = os.path.join(app_static_dir, file)
        file_size = os.path.getsize(file_path)
        logger.info(f"  - {file} ({file_size} bytes)")

    logger.info("Static directory check completed.")

if __name__ == "__main__":
    logger.info("Starting static directory verification")
    ensure_static_directory()
    logger.info("Static directory verification completed")
