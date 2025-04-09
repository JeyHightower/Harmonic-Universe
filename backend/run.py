#!/usr/bin/env python3
"""
Development server for the Harmonic Universe backend.

This script provides a convenient way to run the Flask app for development
using PostgreSQL exclusively.
"""

import os
import sys
import argparse
import logging
from dotenv import load_dotenv
from urllib.parse import urlparse

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_app():
    """
    Run the Flask application with PostgreSQL database.
    """
    # Load environment variables
    load_dotenv()

    # Verify PostgreSQL configuration
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        logger.error("No DATABASE_URL environment variable found")
        logger.error("Please set DATABASE_URL to a valid PostgreSQL connection string:")
        logger.error("  Example: postgresql://username:password@localhost:5432/dbname")
        sys.exit(1)
    
    # Handle PostgreSQL URL format for SQLAlchemy if needed
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        os.environ['DATABASE_URL'] = database_url
        logger.info("Converted 'postgres://' to 'postgresql://' for SQLAlchemy compatibility")
    
    # Verify this is a PostgreSQL connection
    parsed_url = urlparse(database_url)
    if parsed_url.scheme not in ('postgresql', 'postgres'):
        logger.error("DATABASE_URL must be a PostgreSQL connection string")
        logger.error(f"Current value: {database_url}")
        logger.error("Please use a connection string starting with 'postgresql://'")
        sys.exit(1)
    
    logger.info(f"Using PostgreSQL database: {parsed_url.netloc}")

    # Import the Flask app
    try:
        from wsgi import app
        logger.info("Successfully imported app from wsgi.py")
    except ImportError as e:
        logger.error(f"Error importing app from wsgi.py: {e}")
        sys.exit(1)

    # Run the app
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    logger.info(f"Starting development server on port {port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the Flask application for development with PostgreSQL.')
    args = parser.parse_args()
    
    run_app()