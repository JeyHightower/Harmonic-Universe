#!/usr/bin/env python
# Setup script for Render.com deployment

import os
import sys
import logging
import shutil
import platform
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                   datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger("setup_render")

def setup_static_directories():
    """Set up all necessary static directories and files."""
    # Determine if we're on Render.com or local
    is_render = os.environ.get('RENDER', '').lower() == 'true'

    # Log environment details
    logger.info(f"Platform: {platform.platform()}")
    logger.info(f"Python version: {platform.python_version()}")
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Is Render environment: {is_render}")

    # Define static directories
    if is_render:
        render_static = Path('/opt/render/project/src/static')
    else:
        # Use a local path for development
        render_static = Path(os.path.abspath('render_static'))

    local_static = Path('static')
    app_static = Path('app/static')

    # Set all paths absolute for logging clarity
    logger.info(f"Render static path: {render_static.absolute()}")
    logger.info(f"Local static path: {local_static.absolute()}")
    logger.info(f"App static path: {app_static.absolute()}")

    logger.info(f"Setting up static directories for {'Render' if is_render else 'local'} environment")

    # Create static directories
    for static_dir in [render_static, local_static, app_static]:
        try:
            static_dir.mkdir(exist_ok=True)
            logger.info(f"Created static directory: {static_dir}")
        except Exception as e:
            logger.error(f"Failed to create {static_dir}: {e}")

    # Set the environment text based on where we're running
    environment_text = "Render.com" if is_render else "localhost"

    # Create index.html if it doesn't exist
    index_html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
        }}
        .container {{
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px;
        }}
        h1 {{
            color: #3f51b5;
            margin-bottom: 10px;
        }}
        p {{
            color: #555;
            margin-bottom: 20px;
            line-height: 1.5;
        }}
        .btn {{
            display: inline-block;
            background-color: #3f51b5;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.3s;
        }}
        .btn:hover {{
            background-color: #303f9f;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to Harmonic Universe! The application is successfully running on {environment_text}.</p>
        <p>If you're seeing this page, static files are being served correctly.</p>
        <a href="/api/health" class="btn">Check API Health</a>
    </div>
</body>
</html>
"""

    # Always write index.html to all static directories to ensure it exists
    for static_dir in [render_static, local_static, app_static]:
        index_path = static_dir / 'index.html'
        try:
            with open(index_path, 'w') as f:
                f.write(index_html_content)
            logger.info(f"Created/Updated index.html in {static_dir}")
            # Set correct permissions
            os.chmod(index_path, 0o644)
            logger.info(f"Set permissions for {index_path}")
        except Exception as e:
            logger.error(f"Failed to create index.html in {static_dir}: {e}")

    # Try to copy any existing static files from frontend/build if it exists
    frontend_build = Path('frontend/build')
    if frontend_build.exists() and frontend_build.is_dir():
        try:
            # Copy frontend build files to all static directories
            for static_dir in [render_static, local_static, app_static]:
                logger.info(f"Copying frontend build files to {static_dir}")
                for item in frontend_build.glob('*'):
                    # Skip index.html if we already created it
                    if item.name == 'index.html':
                        continue

                    if item.is_file():
                        shutil.copy2(item, static_dir)
                    elif item.is_dir():
                        dest_dir = static_dir / item.name
                        if dest_dir.exists():
                            shutil.rmtree(dest_dir)
                        shutil.copytree(item, dest_dir)
                logger.info(f"Copied frontend build files to {static_dir}")
        except Exception as e:
            logger.error(f"Failed to copy frontend build files: {e}")

    # Verify files exist
    for static_dir in [render_static, local_static, app_static]:
        index_path = static_dir / 'index.html'
        if index_path.exists():
            logger.info(f"✅ Verified index.html exists at {index_path}")
            # Check permissions
            perms = oct(os.stat(index_path).st_mode)[-3:]
            logger.info(f"Permissions for {index_path}: {perms}")
        else:
            logger.error(f"❌ {index_path} does not exist - attempting to create it again")
            try:
                with open(index_path, 'w') as f:
                    f.write(index_html_content)
                os.chmod(index_path, 0o644)
                logger.info(f"Re-created {index_path}")
            except Exception as e:
                logger.error(f"Failed to re-create {index_path}: {e}")

    # Set environment variables
    os.environ['STATIC_FOLDER'] = str(render_static)
    os.environ['STATIC_DIR'] = str(render_static)
    if is_render:
        os.environ['RENDER'] = 'true'

    # Display info about static directories
    logger.info("Static directory setup complete")
    for static_dir in [render_static, local_static, app_static]:
        if static_dir.exists():
            try:
                files = list(static_dir.iterdir())
                logger.info(f"Directory {static_dir} contains {len(files)} files: {[f.name for f in files]}")
            except Exception as e:
                logger.error(f"Could not list directory {static_dir}: {e}")

    return True

if __name__ == "__main__":
    logger.info("Starting Render.com setup script")

    try:
        setup_static_directories()
        logger.info("Render.com setup completed successfully")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Render.com setup failed: {e}", exc_info=True)
        sys.exit(1)
