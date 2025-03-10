"""
Configuration module for Render.com deployment.
"""
import os

def configure_for_render(app):
    """
    Configure Flask application for Render.com deployment.

    This ensures the application listens on the correct port
    and is accessible from outside the container.
    """
    # Get port from environment variable (provided by Render)
    port = int(os.environ.get("PORT", 10000))

    # Log the port we're using
    app.logger.info(f"Configuring for Render deployment on port {port}")

    # Return necessary configuration
    return {
        "host": "0.0.0.0",  # Bind to all interfaces
        "port": port
    }
