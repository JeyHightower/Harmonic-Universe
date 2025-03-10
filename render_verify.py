#!/usr/bin/env python
"""
Render Deployment Verification Script

This script performs comprehensive checks to verify that your deployment is working
correctly, especially focusing on database migration state and application health.

Run this on your Render instance to diagnose issues:
1. Go to Render dashboard > Your web service > Shell
2. Run: python render_verify.py
"""
import os
import sys
import logging
import json
import traceback
from datetime import datetime
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
import importlib.util

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("render_verify")

# The problematic migration ID
MIGRATION_ID = '60ebacf5d282'

class VerificationReport:
    """Tracks verification results"""

    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "environment": {},
            "database": {"tables": [], "alembic_version": None, "connection": "unknown"},
            "application": {"import_status": "unknown", "health_check": "unknown"},
            "recommendations": []
        }

    def add_recommendation(self, text):
        self.results["recommendations"].append(text)

    def print_report(self):
        """Pretty-print the verification report"""
        print("\n" + "="*80)
        print(f"RENDER DEPLOYMENT VERIFICATION REPORT - {self.results['timestamp']}")
        print("="*80)

        # Environment
        print("\n[ENVIRONMENT]")
        for key, value in self.results["environment"].items():
            print(f"  {key}: {value}")

        # Database
        print("\n[DATABASE]")
        conn_status = self.results["database"]["connection"]
        print(f"  Connection: {conn_status}")

        if conn_status == "ok":
            print(f"  Tables found: {len(self.results['database']['tables'])}")
            print(f"  Table list: {', '.join(self.results['database']['tables'])}")
            print(f"  alembic_version: {self.results['database']['alembic_version']}")

        # Application
        print("\n[APPLICATION]")
        print(f"  Import status: {self.results['application']['import_status']}")
        print(f"  Health check: {self.results['application']['health_check']}")

        # Recommendations
        print("\n[RECOMMENDATIONS]")
        if not self.results["recommendations"]:
            print("  ✅ No issues found that require attention.")
        else:
            for i, rec in enumerate(self.results["recommendations"], 1):
                print(f"  {i}. {rec}")

        print("\n" + "="*80)


def check_environment(report):
    """Check environment variables and settings"""
    logger.info("Checking environment...")

    try:
        # Check essential environment variables
        env_vars = [
            "DATABASE_URL",
            "PYTHONPATH",
            "FLASK_APP",
            "PORT",
            "SKIP_DB_UPGRADE"
        ]

        for var in env_vars:
            value = os.environ.get(var)
            if var == "DATABASE_URL" and value:
                masked = f"{value.split('@')[0].split(':')[0]}:****@{value.split('@')[1]}" if '@' in value else "****"
                report.results["environment"][var] = masked
            else:
                report.results["environment"][var] = value if value else "not set"

        # Check Python version
        report.results["environment"]["python_version"] = sys.version

        # Check current directory and files
        report.results["environment"]["current_directory"] = os.getcwd()
        top_level_files = [f for f in os.listdir(".")[:10] if os.path.isfile(f)]
        report.results["environment"]["sample_files"] = top_level_files

        # Add recommendations if needed
        if not os.environ.get("DATABASE_URL"):
            report.add_recommendation("DATABASE_URL environment variable is not set!")

        if not os.environ.get("SKIP_DB_UPGRADE"):
            report.add_recommendation("Set SKIP_DB_UPGRADE=true to prevent migration attempts")

    except Exception as e:
        logger.error(f"Error checking environment: {e}")
        report.add_recommendation(f"Error checking environment: {str(e)}")


def check_database(report):
    """Check database connection and state"""
    logger.info("Checking database...")

    try:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            report.results["database"]["connection"] = "missing URL"
            report.add_recommendation("Set the DATABASE_URL environment variable")
            return

        # Try to connect to the database
        engine = create_engine(database_url)
        engine.connect()
        report.results["database"]["connection"] = "ok"

        # Check tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        report.results["database"]["tables"] = tables

        # Check alembic_version
        if "alembic_version" in tables:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT version_num FROM alembic_version"))
                rows = result.fetchall()
                if rows:
                    report.results["database"]["alembic_version"] = rows[0][0]
                else:
                    report.results["database"]["alembic_version"] = "table exists but empty"
                    report.add_recommendation(
                        f"alembic_version table exists but has no version. "
                        f"Run: INSERT INTO alembic_version (version_num) VALUES ('{MIGRATION_ID}')"
                    )
        else:
            report.results["database"]["alembic_version"] = "table not found"
            if "users" in tables:
                report.add_recommendation(
                    "Users table exists but alembic_version doesn't. Run render_emergency_fix.py "
                    "or SQL from render_db_fix.sql to fix migration state."
                )

    except Exception as e:
        logger.error(f"Error checking database: {e}")
        report.results["database"]["connection"] = "error"
        report.add_recommendation(f"Database connection error: {str(e)}")


def check_application(report):
    """Check application imports and health"""
    logger.info("Checking application imports...")

    try:
        # Try to import the application
        import_patterns = [
            {"module": "app", "attribute": "create_app", "callable": True},
            {"module": "backend.app", "attribute": "create_app", "callable": True},
            {"module": "wsgi", "attribute": "app", "callable": False},
            {"module": "app.main", "attribute": "app", "callable": False},
        ]

        success = False
        for pattern in import_patterns:
            try:
                if importlib.util.find_spec(pattern["module"]):
                    module = importlib.import_module(pattern["module"])
                    attr = getattr(module, pattern["attribute"])
                    if pattern["callable"]:
                        app = attr()
                    else:
                        app = attr

                    # Successfully imported
                    report.results["application"]["import_status"] = f"ok via {pattern['module']}.{pattern['attribute']}"
                    success = True
                    break
            except (ImportError, AttributeError) as e:
                continue

        if not success:
            report.results["application"]["import_status"] = "failed"
            report.add_recommendation(
                "Could not import application. Check your project structure and module imports."
            )

        # Check WSGI wrapper
        if os.path.exists("wsgi_wrapper.py"):
            report.results["application"]["wsgi_wrapper"] = "present"
        else:
            report.results["application"]["wsgi_wrapper"] = "missing"
            report.add_recommendation(
                "wsgi_wrapper.py not found. Create this file to handle database migration issues."
            )

    except Exception as e:
        logger.error(f"Error checking application: {e}")
        report.results["application"]["import_status"] = f"error: {str(e)}"
        report.add_recommendation(f"Application import error: {str(e)}")


def run_verification():
    """Run all verification checks and print report"""
    logger.info("Starting Render deployment verification...")

    report = VerificationReport()

    # Run checks
    check_environment(report)
    check_database(report)
    check_application(report)

    # Print report
    report.print_report()

    # Return code based on whether there are recommendations
    return 0 if not report.results["recommendations"] else 1


if __name__ == "__main__":
    try:
        exit_code = run_verification()
        sys.exit(exit_code)
    except Exception as e:
        logger.error(f"Verification failed with error: {e}")
        traceback.print_exc()
        sys.exit(1)
