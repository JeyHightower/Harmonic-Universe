#!/usr/bin/env python
# Diagnostic script for Render deployment
import os
import sys
import shutil
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("render_diagnose")

def create_fallback_index():
    """Create a fallback index.html in all possible locations"""
    logger.info("Creating fallback index.html files in critical locations")

    # Prepare diagnostic data
    diagnostic_data = {
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "pythonpath": str(sys.path),
        "env": str({k: v for k, v in os.environ.items() if 'SECRET' not in k.upper()})
    }

    # Template for the index.html file
    index_html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
        }
        h1 { color: #333; }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running! This is a fallback page created by render_diagnose.py.</p>
        <div id="api-status">Checking API status...</div>
        <div id="diagnostic-info"></div>
    </div>
    <script>
        // Diagnostic data
        const diagnosticData = %s;

        // Update diagnostic info
        const diagnosticInfo = document.getElementById('diagnostic-info');
        Object.entries(diagnosticData).forEach(([key, value]) => {
            const pre = document.createElement('pre');
            pre.textContent = `${key}: ${value}`;
            diagnosticInfo.appendChild(pre);
        });

        // Check API status
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:' + (data.status === 'healthy' ? 'green' : 'red') + '">' + data.status + '</span>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:red">Connection Failed</span>';
            });
    </script>
</body>
</html>""" % json.dumps(diagnostic_data)

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
