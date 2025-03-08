#!/usr/bin/env python
"""
Test script to validate Render.com deployment configuration.
This script checks:
1. Python environment and dependencies
2. Static file configuration
3. Database access (if credentials are available)
4. WSGI application loading
"""

import os
import sys
import importlib.util
import subprocess
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("render-test")

def check_environment():
    """Check Python environment and dependencies"""
    logger.info("Checking Python environment")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Python executable: {sys.executable}")
    logger.info(f"Current directory: {os.getcwd()}")

    # Check critical dependencies
    dependencies = [
        "flask", "gunicorn", "werkzeug", "psycopg2",
        "sqlalchemy", "jinja2", "itsdangerous"
    ]

    results = {"missing": [], "installed": {}}

    for dep in dependencies:
        try:
            spec = importlib.util.find_spec(dep)
            if spec is None:
                results["missing"].append(dep)
            else:
                module = importlib.import_module(dep)
                version = getattr(module, "__version__", "Unknown")
                results["installed"][dep] = version
        except ImportError:
            results["missing"].append(dep)

    if results["missing"]:
        logger.warning(f"Missing dependencies: {', '.join(results['missing'])}")
    else:
        logger.info("All critical dependencies found")

    logger.info("Installed packages:")
    for pkg, version in results["installed"].items():
        logger.info(f"  {pkg}: {version}")

    return len(results["missing"]) == 0

def check_static_files():
    """Check static file configuration"""
    logger.info("Checking static file configuration")

    static_dir = os.environ.get("STATIC_DIR", "static")
    static_path = Path(static_dir)

    if not static_path.exists():
        logger.warning(f"Static directory '{static_dir}' does not exist")
        return False

    logger.info(f"Static directory exists at: {static_path.absolute()}")

    # Check for key files
    index_html = static_path / "index.html"
    if not index_html.exists():
        logger.warning("index.html not found in static directory")
    else:
        logger.info("index.html found in static directory")

    # List files in static directory
    files = list(static_path.glob('**/*'))
    file_count = len([f for f in files if f.is_file()])
    dir_count = len([f for f in files if f.is_dir()])

    logger.info(f"Static directory contains {file_count} files and {dir_count} directories")

    return index_html.exists()

def check_database():
    """Check database connectivity (if credentials are available)"""
    logger.info("Checking database configuration")

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        logger.warning("DATABASE_URL environment variable not set")
        return False

    try:
        import psycopg2
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        conn.close()

        if result and result[0] == 1:
            logger.info("Database connection successful")
            return True
        else:
            logger.warning("Database connection failed - unexpected result")
            return False
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        return False

def check_wsgi_app():
    """Check if WSGI application can be loaded"""
    logger.info("Checking WSGI application loading")

    try:
        # First try backend module
        try:
            from backend.wsgi import app
            logger.info("Successfully loaded application from backend.wsgi")
            return True
        except ImportError:
            logger.warning("Could not import from backend.wsgi")

        # Then try root wsgi
        try:
            from wsgi import app
            logger.info("Successfully loaded application from wsgi")
            return True
        except ImportError:
            logger.warning("Could not import from wsgi")

        # Try app module directly
        try:
            from app import create_app
            app = create_app()
            logger.info("Successfully loaded application from app.create_app")
            return True
        except ImportError:
            logger.warning("Could not import from app.create_app")

        logger.error("Could not load WSGI application from any expected location")
        return False
    except Exception as e:
        logger.error(f"Error loading WSGI application: {e}")
        return False

def check_build_script():
    """Check render-build.sh script"""
    logger.info("Checking render-build.sh script")

    build_script = Path("render-build.sh")
    if not build_script.exists():
        logger.warning("render-build.sh script not found")
        return False

    if not os.access(build_script, os.X_OK):
        logger.warning("render-build.sh script is not executable")
        return False

    logger.info("render-build.sh script exists and is executable")
    return True

def main():
    """Run all checks and output results"""
    logger.info("=== Starting Render.com deployment validation ===")

    results = {
        "environment": check_environment(),
        "static_files": check_static_files(),
        "database": check_database(),
        "wsgi_app": check_wsgi_app(),
        "build_script": check_build_script()
    }

    logger.info("=== Validation results ===")
    for check, result in results.items():
        status = "PASS" if result else "FAIL"
        logger.info(f"{check}: {status}")

    all_passed = all(results.values())

    if all_passed:
        logger.info("All checks passed! Deployment should work correctly.")
        sys.exit(0)
    else:
        logger.warning("Some checks failed. Review the logs and fix the issues.")
        sys.exit(1)

if __name__ == "__main__":
    main()
