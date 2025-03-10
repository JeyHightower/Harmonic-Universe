import os
import logging

logger = logging.getLogger(__name__)

def get_port():
    """
    Get the port from the environment variable PORT or return a default value.

    This function allows the application to be run on different port configurations:
    - In development, you can set PORT in your environment or .env file
    - In production, platforms like Heroku, Render, or other cloud providers
      often set the PORT environment variable automatically

    Returns:
        int: The port number to use (default: 10000)

    Examples:
        # Running with a custom port
        $ export PORT=8080
        $ python run.py

        # Or in a .env file
        PORT=8080
    """
    try:
        port = int(os.environ.get("PORT", 10000))
        logger.info(f"Using port: {port}")
        return port
    except ValueError as e:
        logger.error(f"Invalid PORT value, using default: {e}")
        return 10000
