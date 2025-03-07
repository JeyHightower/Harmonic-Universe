#!/usr/bin/env python3
"""
Migration State Checker

This script checks the state of database migrations and verifies if the
"relation already exists" fix is properly applied.
"""

import os
import sys
import time
import logging
import argparse
from datetime import datetime
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class MigrationStateChecker:
    """Checks the state of database migrations and overall database health."""

    def __init__(self, database_url=None):
        """Initialize the checker with the provided database URL or from environment."""
        self.database_url = database_url or os.getenv('DATABASE_URL')
        self.report = []
        self.issues_found = False
        self.connection = None
        self.cursor = None

    def add_report_item(self, message, status="INFO", details=None):
        """Add an item to the report with the specified status."""
        item = {
            "message": message,
            "status": status,
            "details": details or {},
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self.report.append(item)

        if status == "ERROR":
            logger.error(message)
            self.issues_found = True
        elif status == "WARNING":
            logger.warning(message)
            self.issues_found = True
        else:
            logger.info(message)

    def connect_to_database(self):
        """Connect to the database specified in DATABASE_URL."""
        if not self.database_url:
            self.add_report_item(
                "No DATABASE_URL found in environment variables",
                "ERROR",
                {"fix": "Set the DATABASE_URL environment variable"}
            )
            return False

        try:
            self.connection = psycopg2.connect(self.database_url)
            self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            self.cursor = self.connection.cursor()
            self.add_report_item("Successfully connected to database")
            return True
        except Exception as e:
            self.add_report_item(
                f"Failed to connect to database: {str(e)}",
                "ERROR",
                {"fix": "Check your DATABASE_URL and ensure the database server is running"}
            )
            return False

    def check_alembic_version(self):
        """Check if the alembic_version table exists and has the correct version."""
        if not self.connection:
            return

        try:
            # Check if alembic_version table exists
            self.cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'alembic_version'
                );
            """)
            table_exists = self.cursor.fetchone()[0]

            if not table_exists:
                self.add_report_item(
                    "alembic_version table does not exist",
                    "WARNING",
                    {"fix": "Run the emergency fix script to create the alembic_version table"}
                )
                return

            # Check the version number
            self.cursor.execute("SELECT version_num FROM alembic_version;")
            versions = self.cursor.fetchall()

            if not versions:
                self.add_report_item(
                    "alembic_version table exists but has no entries",
                    "WARNING",
                    {"fix": "Run the emergency fix script to insert the correct version"}
                )
                return

            if len(versions) > 1:
                self.add_report_item(
                    f"Multiple version entries found: {versions}",
                    "WARNING",
                    {"fix": "Delete all entries and insert only '60ebacf5d282'"}
                )
                return

            version = versions[0][0]
            if version != '60ebacf5d282':
                self.add_report_item(
                    f"Incorrect version found: {version}",
                    "WARNING",
                    {"fix": "The version should be '60ebacf5d282'"}
                )
            else:
                self.add_report_item(
                    "Correct migration version found: 60ebacf5d282",
                    "INFO"
                )
        except Exception as e:
            self.add_report_item(
                f"Error checking alembic_version: {str(e)}",
                "ERROR"
            )

    def check_tables(self):
        """Check for the existence of key tables."""
        if not self.connection:
            return

        try:
            # Get a list of all tables
            self.cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public';
            """)
            tables = [row[0] for row in self.cursor.fetchall()]

            # Check for important tables
            key_tables = ['users', 'albums', 'tracks', 'playlists']
            missing_tables = [table for table in key_tables if table not in tables]

            if missing_tables:
                self.add_report_item(
                    f"Missing key tables: {', '.join(missing_tables)}",
                    "WARNING",
                    {"fix": "Check your database migrations"}
                )
            else:
                self.add_report_item(
                    f"All key tables found: {', '.join(key_tables)}",
                    "INFO"
                )

            self.add_report_item(
                f"Total tables found: {len(tables)}",
                "INFO",
                {"tables": tables}
            )
        except Exception as e:
            self.add_report_item(
                f"Error checking tables: {str(e)}",
                "ERROR"
            )

    def apply_fix_if_needed(self):
        """Apply the fix if issues are detected with alembic_version."""
        if not self.connection:
            return

        try:
            # Check if we need to apply the fix
            self.cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'alembic_version'
                );
            """)
            table_exists = self.cursor.fetchone()[0]

            if not table_exists:
                self.add_report_item(
                    "Applying fix: Creating alembic_version table",
                    "INFO"
                )
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS alembic_version (
                        version_num VARCHAR(32) NOT NULL,
                        PRIMARY KEY (version_num)
                    );
                """)

            # Check if we need to set the version
            self.cursor.execute("""
                SELECT COUNT(*) FROM alembic_version
                WHERE version_num = '60ebacf5d282';
            """)
            correct_version_exists = self.cursor.fetchone()[0] > 0

            if not correct_version_exists:
                self.add_report_item(
                    "Applying fix: Setting correct migration version",
                    "INFO"
                )
                self.cursor.execute("DELETE FROM alembic_version;")
                self.cursor.execute(
                    "INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282');"
                )

            # Verify the fix was applied
            self.cursor.execute("SELECT version_num FROM alembic_version;")
            versions = self.cursor.fetchall()

            if len(versions) == 1 and versions[0][0] == '60ebacf5d282':
                self.add_report_item(
                    "Fix successfully applied",
                    "INFO"
                )
            else:
                self.add_report_item(
                    f"Fix application failed, current versions: {versions}",
                    "ERROR"
                )
        except Exception as e:
            self.add_report_item(
                f"Error applying fix: {str(e)}",
                "ERROR"
            )

    def run_check(self, auto_fix=False):
        """Run all checks and optionally apply fixes."""
        self.add_report_item("Starting database migration state check")

        if not self.connect_to_database():
            return self.generate_report()

        self.check_alembic_version()
        self.check_tables()

        if auto_fix and self.issues_found:
            self.add_report_item("Issues found, attempting to apply fixes")
            self.apply_fix_if_needed()
            # Recheck after fix
            self.check_alembic_version()

        self.close_connection()
        return self.generate_report()

    def close_connection(self):
        """Close the database connection."""
        if self.connection:
            if self.cursor:
                self.cursor.close()
            self.connection.close()
            self.add_report_item("Database connection closed")

    def generate_report(self):
        """Generate a formatted report of all checks."""
        report_str = "\n" + "=" * 80 + "\n"
        report_str += "DATABASE MIGRATION STATE REPORT\n"
        report_str += f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        report_str += "=" * 80 + "\n\n"

        for item in self.report:
            status_symbol = "✓" if item["status"] == "INFO" else "⚠️" if item["status"] == "WARNING" else "✗"
            report_str += f"{item['timestamp']} [{item['status']}] {status_symbol} {item['message']}\n"

            if item["details"] and item["status"] != "INFO":
                for key, value in item["details"].items():
                    if key == "fix":
                        report_str += f"  → FIX: {value}\n"
                    else:
                        report_str += f"  → {key.upper()}: {value}\n"

            report_str += "\n"

        if self.issues_found:
            report_str += "=" * 80 + "\n"
            report_str += "ISSUES WERE FOUND! Please address them to ensure proper database operation.\n"
            report_str += "=" * 80 + "\n"
        else:
            report_str += "=" * 80 + "\n"
            report_str += "All checks passed! Your database migration state appears to be healthy.\n"
            report_str += "=" * 80 + "\n"

        return report_str

def main():
    """Main function to parse arguments and run the checker."""
    parser = argparse.ArgumentParser(description='Check database migration state.')
    parser.add_argument(
        '--database-url',
        help='Database URL (defaults to DATABASE_URL environment variable)'
    )
    parser.add_argument(
        '--auto-fix',
        action='store_true',
        help='Automatically apply fixes for known issues'
    )
    parser.add_argument(
        '--output',
        help='Output file for the report (defaults to stdout)'
    )

    args = parser.parse_args()

    checker = MigrationStateChecker(args.database_url)
    report = checker.run_check(args.auto_fix)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"Report written to {args.output}")
    else:
        print(report)

    return 1 if checker.issues_found else 0

if __name__ == "__main__":
    sys.exit(main())
