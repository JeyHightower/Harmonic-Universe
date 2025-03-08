#!/usr/bin/env python
"""
Script to ensure the static directory exists and contains the required files.
This script is designed to run as part of the gunicorn startup process.
"""
import os
import sys
import logging
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
    Ensure the static directory exists and contains the required files.
    This function will create the directory and files if they don't exist.
    """
    # Define common static directories
    static_dirs = [
        "/opt/render/project/src/static",  # Render absolute path
        os.path.join(os.getcwd(), "static"),  # Root static
        os.path.join(os.getcwd(), "app/static"),  # App static
    ]

    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Directory listing: {os.listdir('.')}")

    # First, ensure all directories exist
    for static_dir in static_dirs:
        try:
            Path(static_dir).mkdir(parents=True, exist_ok=True)
            logger.info(f"Ensured static directory exists: {static_dir}")
        except Exception as e:
            logger.error(f"Failed to create static directory {static_dir}: {e}")

    # Create the index.html content
    index_html = """<!DOCTYPE html>
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
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .button {
            display: inline-block;
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
            color: white;
            text-decoration: none;
            padding: 0.8rem 1.8rem;
            border-radius: 30px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe platform. The application is running successfully!</p>
        <p>This is a creative platform for music and physics visualization.</p>
        <div>
            <a href="/api/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
        </div>
    </div>
</body>
</html>"""

    # Force-create index.html in all static directories
    for static_dir in static_dirs:
        try:
            index_path = os.path.join(static_dir, "index.html")
            with open(index_path, "w") as f:
                f.write(index_html)

            # Set permissions to be world-readable
            os.chmod(index_path, 0o644)
            logger.info(f"Created index.html at {index_path} with permissions 644")

            # Verify the file exists and is readable
            if os.path.exists(index_path) and os.access(index_path, os.R_OK):
                with open(index_path, "r") as f:
                    content = f.read(100)  # Just read the first 100 chars to verify
                logger.info(f"Successfully read from {index_path}: {content[:50]}...")
            else:
                logger.error(f"File exists but cannot be read: {index_path}")
        except Exception as e:
            logger.error(f"Failed to create or verify index.html at {index_path}: {e}")

    # Create symbolic links between directories for redundancy
    try:
        # Use the Render path as the primary one if it exists
        render_static = "/opt/render/project/src/static"
        if os.path.exists(render_static):
            for static_dir in static_dirs:
                if static_dir != render_static and not os.path.exists(static_dir):
                    try:
                        # Create parent directory if needed
                        os.makedirs(os.path.dirname(static_dir), exist_ok=True)
                        os.symlink(render_static, static_dir)
                        logger.info(f"Created symlink from {render_static} to {static_dir}")
                    except Exception as e:
                        logger.error(f"Failed to create symlink to {static_dir}: {e}")
    except Exception as e:
        logger.error(f"Error setting up symlinks: {e}")

    # Final verification
    logger.info("Final verification of static directories:")
    for static_dir in static_dirs:
        if os.path.exists(static_dir):
            try:
                files = os.listdir(static_dir)
                logger.info(f"Directory {static_dir} exists with contents: {files}")

                # Check index.html specifically
                index_path = os.path.join(static_dir, "index.html")
                if os.path.exists(index_path):
                    logger.info(f"  ✅ {index_path} exists")

                    # Check file size
                    size = os.path.getsize(index_path)
                    logger.info(f"  📄 File size: {size} bytes")

                    # Check permissions
                    mode = oct(os.stat(index_path).st_mode)[-3:]
                    logger.info(f"  🔒 File permissions: {mode}")
                else:
                    logger.error(f"  ❌ {index_path} does not exist")
            except Exception as e:
                logger.error(f"Error checking directory {static_dir}: {e}")
        else:
            logger.error(f"Directory {static_dir} does not exist")

if __name__ == "__main__":
    logger.info("Starting static directory verification")
    ensure_static_directory()
    logger.info("Static directory verification completed")
