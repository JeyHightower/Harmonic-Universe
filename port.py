import os
import logging

logger = logging.getLogger(__name__)

def get_port():
    """Get the port from environment variable or return default"""
    try:
        port = int(os.environ.get("PORT", 10000))
        logger.info(f"Using port: {port}")
        return port
    except ValueError as e:
        logger.error(f"Invalid PORT value, using default: {e}")
        return 10000
