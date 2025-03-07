#!/usr/bin/env python
# Application factory pattern for gunicorn
import os
import sys
import logging
import traceback
from port import get_port

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("wsgi")

logger.info("Loading application in wsgi.py")

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Log environment information
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")

# Try to import psycopg2 and log version info for debugging
try:
    import psycopg2
    logger.info(f"Using psycopg2 version: {psycopg2.__version__}")
except ImportError:
    logger.error("Failed to import psycopg2. Check if it's installed correctly.")
except Exception as e:
    logger.error(f"Error importing psycopg2: {str(e)}")

# Ensure static directory exists
static_dir = '/opt/render/project/src/static'
try:
    os.makedirs(static_dir, exist_ok=True)
    os.chmod(static_dir, 0o755)
    logger.info(f"Ensured static directory exists: {static_dir}")
except Exception as e:
    logger.error(f"Error setting up static directory: {e}")
    raise

# Check for index.html and create it if needed
render_index = os.path.join(static_dir, 'index.html')
if not os.path.exists(render_index):
    try:
        with open(render_index, 'w') as f:
            f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            color: #333;
        }
        header {
            background-color: #2c3e50;
            color: white;
            padding: 2rem;
            text-align: center;
        }
        main {
            flex: 1;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }
        .status-box {
            background-color: white;
            border-radius: 8px;
            padding: 2rem;
            margin-top: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { margin: 0; color: white; }
        h2 { color: #2c3e50; }
    </style>
</head>
<body>
    <header>
        <h1>Harmonic Universe</h1>
        <p>Interactive Music Experience</p>
    </header>
    <main>
        <div class="status-box">
            <h2>Application Status</h2>
            <p id="status-message">Checking application status...</p>
        </div>
    </main>
    <script>
        // Function to check API health
        async function checkHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('status-message').textContent =
                    `Status: ${data.status} | Database: ${data.database}`;
            } catch (error) {
                document.getElementById('status-message').textContent =
                    'Status: Error connecting to API';
            }
        }

        // Check health immediately and every 30 seconds
        checkHealth();
        setInterval(checkHealth, 30000);
    </script>
</body>
</html>""")
        logger.info(f"Created index.html at {render_index}")
        # Ensure proper permissions
        os.chmod(render_index, 0o644)
    except Exception as e:
        logger.error(f"Failed to create index.html: {e}")

# Import dependencies to verify they're installed
try:
    logger.info(f"Found Flask: {__import__('flask').__version__}")
    logger.info(f"Found SQLAlchemy: {__import__('sqlalchemy').__version__}")
    from flask_migrate import Migrate
    logger.info("Successfully imported Flask-Migrate")
except ImportError as e:
    logger.error(f"Failed to import required dependencies: {e}")
except Exception as e:
    logger.error(f"Error verifying dependencies: {e}")

# Import and create the Flask application
try:
    from app import create_app
    app = create_app()
    logger.info("Successfully created Flask application")
except Exception as e:
    logger.error(f"Failed to create Flask application: {e}")
    logger.error(traceback.format_exc())
    raise

# Log application configuration
logger.info(f"App static folder: {app.static_folder}")
logger.info(f"App static url path: {app.static_url_path}")
logger.info(f"Static folder exists: {os.path.exists(app.static_folder)}")

if __name__ == "__main__":
    # Run the application in development
    port = get_port()
    logger.info(f"Starting development server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
