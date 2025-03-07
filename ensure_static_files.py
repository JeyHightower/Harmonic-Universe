#!/usr/bin/env python
"""
Ensure static files script for Harmonic Universe
This script ensures that the correct static files exist in all potential static directories
"""
import os
import sys
import shutil
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ensure_static_files")

# Define the minimal index.html content
MINIMAL_INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        main {
            flex: 1;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
        }
        h1 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        p {
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .status-box {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            background-color: #f9f9f9;
        }
        footer {
            background-color: #34495e;
            color: white;
            text-align: center;
            padding: 15px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <header>
        <h1>Harmonic Universe</h1>
        <p>Interactive Music Experience</p>
    </header>
    <main>
        <p>Welcome to Harmonic Universe! This is a fallback page created by ensure_static_files.py.</p>
        <p>The application is running, but the frontend files might not be fully loaded yet.</p>
        <div class="status-box">
            <h3>Application Status</h3>
            <p id="status-message">Checking API status...</p>
        </div>
    </main>
    <footer>
        <p>Harmonic Universe &copy; 2024</p>
    </footer>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status-message').textContent =
                    'API Status: ' + (data.status || 'Unknown');
            })
            .catch(error => {
                document.getElementById('status-message').textContent =
                    'API Status: Connection Failed';
            });
    </script>
</body>
</html>
"""

def ensure_static_files():
    """Ensure all potential static directories have the required files"""
    # Get the current working directory
    current_dir = os.getcwd()
    logger.info(f"Current working directory: {current_dir}")

    # Define potential static directories (in priority order)
    static_dirs = [
        # Primary locations
        '/opt/render/project/src/static',       # Render's expected location
        os.path.join(current_dir, 'static'),    # Local static directory

        # Secondary locations (might be used by different modules)
        os.path.join(current_dir, 'app', 'static'),
        os.path.join(current_dir, 'backend', 'static'),
    ]

    # Set permissions
    file_permissions = 0o644  # rw-r--r--
    dir_permissions = 0o755   # rwxr-xr-x

    # Ensure each directory exists
    for static_dir in static_dirs:
        try:
            os.makedirs(static_dir, exist_ok=True)
            os.chmod(static_dir, dir_permissions)
            logger.info(f"Ensured directory exists: {static_dir}")
        except Exception as e:
            logger.error(f"Failed to create directory {static_dir}: {e}")

    # Find the first directory that has a valid index.html
    source_file = None
    for static_dir in static_dirs:
        potential_file = os.path.join(static_dir, 'index.html')
        if os.path.exists(potential_file) and os.path.getsize(potential_file) > 100:
            source_file = potential_file
            logger.info(f"Found existing index.html at {potential_file}")
            break

    # If no index.html found, create one in the primary location
    if not source_file:
        primary_dir = static_dirs[0]  # Render's location is first priority
        source_file = os.path.join(primary_dir, 'index.html')
        try:
            with open(source_file, 'w') as f:
                f.write(MINIMAL_INDEX_HTML)
            os.chmod(source_file, file_permissions)
            logger.info(f"Created new index.html at {source_file}")
        except Exception as e:
            logger.error(f"Failed to create index.html at {source_file}: {e}")
            return

    # Copy the index.html to all other static directories
    source_content = None
    try:
        with open(source_file, 'r') as f:
            source_content = f.read()
    except Exception as e:
        logger.error(f"Failed to read source file {source_file}: {e}")
        return

    # Make sure each directory has the index.html file
    for static_dir in static_dirs:
        target_file = os.path.join(static_dir, 'index.html')
        if target_file != source_file:  # Don't overwrite the source file
            try:
                with open(target_file, 'w') as f:
                    f.write(source_content)
                os.chmod(target_file, file_permissions)
                logger.info(f"Copied index.html to {target_file}")
            except Exception as e:
                logger.error(f"Failed to copy index.html to {target_file}: {e}")

    # Double check that index.html exists in the Render-specific location
    render_index = '/opt/render/project/src/static/index.html'
    if os.path.exists(render_index):
        logger.info(f"Verified index.html exists at {render_index}")
    else:
        logger.error(f"index.html STILL NOT FOUND at {render_index}")
        try:
            # Last resort - try to create it directly
            with open(render_index, 'w') as f:
                f.write(MINIMAL_INDEX_HTML)
            os.chmod(render_index, file_permissions)
            logger.info(f"Last resort: Created index.html at {render_index}")
        except Exception as e:
            logger.error(f"Last resort failed! Could not create index.html: {e}")

if __name__ == "__main__":
    logger.info("Starting static files verification")
    ensure_static_files()
    logger.info("Static files verification complete")
