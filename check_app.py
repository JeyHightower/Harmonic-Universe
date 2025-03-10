#!/usr/bin/env python
"""
Application Status Check Script

This script checks the status of the Harmonic Universe application and provides
troubleshooting information for common issues.
"""

import os
import sys
import json
import logging
import platform
import requests
import subprocess
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
DEFAULT_APP_URL = "http://localhost:10000"  # Default local development URL
RENDER_APP_URL = os.environ.get("RENDER_EXTERNAL_URL")  # For Render deployments

def get_app_url():
    """Determine the application URL to check"""
    if RENDER_APP_URL:
        return RENDER_APP_URL
    return DEFAULT_APP_URL

def check_environment():
    """Check the environment and return system information"""
    env_info = {
        "timestamp": datetime.now().isoformat(),
        "os": platform.platform(),
        "python_version": platform.python_version(),
        "python_path": sys.executable,
        "current_dir": os.path.abspath(os.getcwd()),
        "env_vars": {
            "FLASK_APP": os.environ.get("FLASK_APP"),
            "FLASK_ENV": os.environ.get("FLASK_ENV"),
            "DATABASE_URL": mask_db_url(os.environ.get("DATABASE_URL", "")),
            "RENDER_EXTERNAL_URL": os.environ.get("RENDER_EXTERNAL_URL"),
        }
    }
    return env_info

def mask_db_url(url):
    """Mask sensitive information in database URL"""
    if not url or "@" not in url:
        return url

    parts = url.split('@')
    if '://' in parts[0]:
        protocol_parts = parts[0].split('://')
        return f"{protocol_parts[0]}://****:****@{parts[1]}"
    return "****:****@" + parts[1]

def check_database():
    """Check database connection and status"""
    db_info = {
        "status": "unknown",
        "error": None,
        "tables": [],
        "migrations": {
            "alembic_exists": False,
            "version": None,
            "error": None
        }
    }

    # Check if DATABASE_URL is set
    if not os.environ.get("DATABASE_URL"):
        db_info["status"] = "not_configured"
        db_info["error"] = "DATABASE_URL environment variable not set"
        return db_info

    try:
        # Try to import SQLAlchemy and connect to the database
        from sqlalchemy import create_engine, text

        engine = create_engine(os.environ.get("DATABASE_URL"))

        # Check connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_info["status"] = "connected"

            # Get table count
            result = conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
            ))
            table_count = result.scalar()

            # Get table names if there are tables
            if table_count > 0:
                result = conn.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                ))
                db_info["tables"] = [row[0] for row in result]

            # Check for alembic_version table
            try:
                result = conn.execute(text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alembic_version')"
                ))
                alembic_exists = result.scalar()

                if alembic_exists:
                    db_info["migrations"]["alembic_exists"] = True

                    # Get current version
                    result = conn.execute(text("SELECT version_num FROM alembic_version"))
                    row = result.fetchone()
                    if row:
                        db_info["migrations"]["version"] = row[0]
            except Exception as e:
                db_info["migrations"]["error"] = str(e)

    except ImportError:
        db_info["status"] = "error"
        db_info["error"] = "SQLAlchemy not installed. Run: pip install sqlalchemy"
    except Exception as e:
        db_info["status"] = "error"
        db_info["error"] = str(e)

    return db_info

def check_app_status(url):
    """Check if the application is running and accessible"""
    app_status = {
        "status": "unknown",
        "error": None,
        "health_check": None,
        "response_time_ms": None
    }

    try:
        # Try to connect to the application
        start_time = datetime.now()
        response = requests.get(f"{url}/api/health", timeout=5)
        end_time = datetime.now()

        # Calculate response time
        response_time = (end_time - start_time).total_seconds() * 1000
        app_status["response_time_ms"] = round(response_time, 2)

        if response.status_code == 200:
            app_status["status"] = "running"
            app_status["health_check"] = response.json()
        else:
            app_status["status"] = "error"
            app_status["error"] = f"Unexpected status code: {response.status_code}"

    except requests.exceptions.ConnectionError:
        app_status["status"] = "not_running"
        app_status["error"] = "Could not connect to the application"
    except requests.exceptions.Timeout:
        app_status["status"] = "timeout"
        app_status["error"] = "Connection timed out"
    except Exception as e:
        app_status["status"] = "error"
        app_status["error"] = str(e)

    return app_status

def check_static_files():
    """Check if static files exist and are accessible"""
    static_info = {
        "static_dir": os.path.join(os.getcwd(), "static"),
        "exists": False,
        "files": [],
        "index_html": False
    }

    # Check if static directory exists
    if os.path.exists(static_info["static_dir"]):
        static_info["exists"] = True

        # List files in static directory
        try:
            files = os.listdir(static_info["static_dir"])
            static_info["files"] = files[:10]  # List first 10 files

            # Check for index.html
            if "index.html" in files:
                static_info["index_html"] = True
        except Exception as e:
            static_info["error"] = str(e)

    return static_info

def check_migrations():
    """Check migration files and status"""
    migration_info = {
        "directories_checked": [],
        "migration_files": [],
        "error": None
    }

    # Common migration directory paths
    possible_paths = [
        'migrations/versions',
        'backend/migrations/versions',
        'app/migrations/versions',
        'src/migrations/versions',
        'api/migrations/versions'
    ]

    # Check all standard paths
    for path in possible_paths:
        migration_info["directories_checked"].append(path)
        if os.path.exists(path) and os.path.isdir(path):
            try:
                files = os.listdir(path)
                for filename in files:
                    if filename.endswith('.py') and not filename.startswith('__'):
                        migration_id = filename.split('_')[0]
                        migration_info["migration_files"].append({
                            "id": migration_id,
                            "filename": filename,
                            "path": os.path.join(path, filename)
                        })
            except Exception as e:
                migration_info["error"] = str(e)

    return migration_info

def get_troubleshooting_tips(status):
    """Generate troubleshooting tips based on application status"""
    tips = []

    # Database issues
    if status["database"]["status"] != "connected":
        tips.append("Database Connection Issue:")
        tips.append("- Check that DATABASE_URL environment variable is set correctly")
        tips.append("- Verify database server is running and accessible")
        tips.append("- Check network connectivity to database server")
        tips.append("- Run 'python fix_migrations.py' to fix migration issues")

    # Application not running
    if status["app"]["status"] != "running":
        tips.append("Application Not Running:")
        tips.append("- Start the application with 'python run.py'")
        tips.append("- Check application logs for errors")
        tips.append("- Verify required environment variables are set")

    # Static files issues
    if not status["static"]["exists"] or not status["static"]["index_html"]:
        tips.append("Static Files Issue:")
        tips.append("- Verify static directory exists at the correct location")
        tips.append("- Check that index.html exists in the static directory")
        tips.append("- Ensure static files have correct permissions")

    # Migration issues
    if not status["database"]["migrations"]["alembic_exists"] and status["database"]["status"] == "connected":
        tips.append("Migration Issue:")
        tips.append("- Run 'python fix_migrations.py' to initialize migration tracking")
        tips.append("- Check if migrations have been applied correctly")

    # General tips
    if not tips:
        tips.append("Application appears to be running correctly!")
        tips.append("- For more detailed information, visit /troubleshoot in your browser")
        tips.append("- API health check endpoint is available at /api/health")
        tips.append("- Troubleshooting API is available at /api/troubleshoot")

    return tips

def main():
    """Main function to check application status and provide troubleshooting information"""
    logger.info("Starting application status check")

    # Get application URL
    app_url = get_app_url()
    logger.info(f"Using application URL: {app_url}")

    # Collect status information
    status = {
        "timestamp": datetime.now().isoformat(),
        "environment": check_environment(),
        "database": check_database(),
        "app": check_app_status(app_url),
        "static": check_static_files(),
        "migrations": check_migrations()
    }

    # Generate troubleshooting tips
    tips = get_troubleshooting_tips(status)

    # Print status summary
    print("\n" + "=" * 80)
    print("HARMONIC UNIVERSE APPLICATION STATUS CHECK")
    print("=" * 80)

    print(f"\nTimestamp: {status['timestamp']}")
    print(f"Environment: {status['environment']['env_vars']['FLASK_ENV'] or 'production'}")
    print(f"Python: {status['environment']['python_version']}")
    print(f"OS: {status['environment']['os']}")

    print("\nSTATUS SUMMARY:")
    print(f"- Application: {status['app']['status'].upper()}")
    if status['app']['response_time_ms']:
        print(f"  Response Time: {status['app']['response_time_ms']}ms")
    if status['app']['error']:
        print(f"  Error: {status['app']['error']}")

    print(f"- Database: {status['database']['status'].upper()}")
    if status['database']['error']:
        print(f"  Error: {status['database']['error']}")
    if status['database']['tables']:
        print(f"  Tables: {len(status['database']['tables'])}")

    print(f"- Migrations: {'TRACKED' if status['database']['migrations']['alembic_exists'] else 'NOT TRACKED'}")
    if status['database']['migrations']['version']:
        print(f"  Current Version: {status['database']['migrations']['version']}")

    print(f"- Static Files: {'AVAILABLE' if status['static']['exists'] else 'MISSING'}")
    if status['static']['index_html']:
        print(f"  index.html: FOUND")
    elif status['static']['exists']:
        print(f"  index.html: MISSING")

    print("\nTROUBLESHOOTING TIPS:")
    for tip in tips:
        print(tip)

    print("\nFor more detailed information, run with --verbose flag")
    print("=" * 80 + "\n")

    # If verbose flag is provided, print detailed information
    if "--verbose" in sys.argv:
        print("\nDETAILED INFORMATION:")
        print(json.dumps(status, indent=2))

    # Return status code based on application status
    if status["app"]["status"] == "running" and status["database"]["status"] == "connected":
        return 0
    return 1

if __name__ == "__main__":
    sys.exit(main())
