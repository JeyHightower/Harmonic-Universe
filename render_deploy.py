#!/usr/bin/env python3
"""
Render deployment script for Harmonic Universe

This script is designed to set up the Python environment and verify
that all critical dependencies are installed before the application starts.
"""

import os
import sys
import subprocess
import importlib.util
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("render_deploy")

# Critical packages that must be installed
CRITICAL_PACKAGES = [
    "flask",
    "flask-sqlalchemy",
    "flask-migrate",
    "flask-login",
    "flask-cors",
    "gunicorn",
    "psycopg2-binary",
    "werkzeug",
    "jinja2",
    "itsdangerous",
    "click"
]

def check_package_installed(package_name):
    """Check if a package is installed"""
    spec = importlib.util.find_spec(package_name.replace('-', '_'))
    return spec is not None

def install_package(package_name):
    """Install a package using pip"""
    logger.info(f"Installing {package_name}...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        return True
    except subprocess.CalledProcessError:
        logger.error(f"Failed to install {package_name}")
        return False

def setup_environment():
    """Set up the Python environment for Render deployment"""
    logger.info("Setting up Python environment for Render deployment")
    
    # Upgrade pip first
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    except:
        logger.warning("Failed to upgrade pip, continuing anyway")
    
    # Install critical packages
    for package in CRITICAL_PACKAGES:
        if not check_package_installed(package):
            if not install_package(package):
                logger.error(f"Critical package {package} could not be installed!")
                # Continue trying other packages anyway
    
    # Verify Flask installation
    if check_package_installed("flask"):
        import flask
        logger.info(f"Flask successfully installed (version {flask.__version__})")
    else:
        logger.critical("Flask installation failed!")
        return False
    
    # Add current directory to Python path
    base_dir = os.path.abspath(os.path.dirname(__file__))
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)
    
    # Add backend directory to Python path
    backend_dir = os.path.join(base_dir, 'backend')
    if os.path.exists(backend_dir) and backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    # Log Python path for debugging
    logger.info(f"Python path: {sys.path}")
    
    return True

if __name__ == "__main__":
    success = setup_environment()
    
    if success:
        logger.info("Environment setup completed successfully")
        sys.exit(0)
    else:
        logger.critical("Environment setup failed")
        sys.exit(1) 