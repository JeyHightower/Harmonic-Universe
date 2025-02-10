#!/usr/bin/env python3
"""Unified initialization script for setting up the application."""

import argparse
import os
import sys
import subprocess
from typing import List, Dict, Any
import json
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

class Initializer:
    """Handles all initialization tasks for the application."""

    def __init__(self, env: str = "development"):
        """Initialize with environment."""
        self.env = env
        self.root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration based on environment."""
        config_path = os.path.join(self.root_dir, 'config', f'{self.env}.json')
        try:
            with open(config_path) as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file not found: {config_path}")
            return {}

    def setup_directories(self) -> None:
        """Create necessary directories."""
        directories = [
            'logs',
            'uploads',
            'uploads/audio',
            'uploads/exports',
            'uploads/temp',
            'backups',
            'reports'
        ]

        for directory in directories:
            path = os.path.join(self.root_dir, directory)
            os.makedirs(path, exist_ok=True)
            logger.info(f"Created directory: {path}")

    def setup_database(self) -> None:
        """Initialize and verify database."""
        try:
            # Run database initialization
            subprocess.run(
                [sys.executable, 'scripts/init_db.py', '--env', self.env],
                check=True
            )

            # Verify database setup
            subprocess.run(
                [sys.executable, 'scripts/verify_db.py', '--env', self.env],
                check=True
            )

            logger.info("Database setup completed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"Database setup failed: {str(e)}")
            raise

    def setup_environment(self) -> None:
        """Set up environment variables and configuration."""
        env_file = os.path.join(self.root_dir, f'.env.{self.env}')
        if not os.path.exists(env_file):
            with open(env_file, 'w') as f:
                f.write(f"ENVIRONMENT={self.env}\n")
                f.write(f"DATABASE_URL={self.config.get('database_url', '')}\n")
                f.write(f"SECRET_KEY={self.config.get('secret_key', '')}\n")
                f.write(f"DEBUG={str(self.env == 'development').lower()}\n")
            logger.info(f"Created environment file: {env_file}")

    def run_migrations(self) -> None:
        """Run database migrations."""
        try:
            subprocess.run(
                ['alembic', 'upgrade', 'head'],
                check=True
            )
            logger.info("Database migrations completed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"Database migrations failed: {str(e)}")
            raise

    def setup_test_environment(self) -> None:
        """Set up test environment if needed."""
        if self.env == "test":
            try:
                subprocess.run(
                    [sys.executable, 'scripts/run_tests.py', '--setup-only'],
                    check=True
                )
                logger.info("Test environment setup completed successfully")
            except subprocess.CalledProcessError as e:
                logger.error(f"Test environment setup failed: {str(e)}")
                raise

    def generate_documentation(self) -> None:
        """Generate API documentation."""
        try:
            subprocess.run(
                ['sphinx-build', '-b', 'html', 'docs/source', 'docs/build/html'],
                check=True
            )
            logger.info("Documentation generated successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"Documentation generation failed: {str(e)}")
            logger.warning("Continuing without documentation")

    def initialize(self) -> None:
        """Run all initialization tasks."""
        try:
            logger.info(f"Starting initialization for {self.env} environment")

            self.setup_directories()
            self.setup_environment()
            self.setup_database()
            self.run_migrations()

            if self.env == "test":
                self.setup_test_environment()

            self.generate_documentation()

            logger.info("Initialization completed successfully")

        except Exception as e:
            logger.error(f"Initialization failed: {str(e)}")
            sys.exit(1)

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Initialize the application")
    parser.add_argument(
        '--env',
        choices=['development', 'test', 'production'],
        default='development',
        help='Environment to initialize'
    )
    args = parser.parse_args()

    initializer = Initializer(env=args.env)
    initializer.initialize()

if __name__ == '__main__':
    main()
