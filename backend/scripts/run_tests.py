#!/usr/bin/env python3
"""Test runner script with setup and teardown."""

import os
import sys
import subprocess
import pytest
import logging
from datetime import datetime
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_test_environment() -> None:
    """Set up test environment."""
    try:
        # Initialize test database
        subprocess.run(['python', 'scripts/db_ops.py', 'init', '--test'], check=True)
        logger.info("Test environment setup completed")
    except subprocess.CalledProcessError as e:
        logger.error(f"Test environment setup failed: {e}")
        sys.exit(1)

def run_tests(test_path: str = None, coverage: bool = False) -> None:
    """Run pytest with optional coverage."""
    try:
        args = ['pytest', '-v']

        if coverage:
            args.extend([
                '--cov=app',
                '--cov-report=term-missing',
                '--cov-report=html:reports/coverage'
            ])

        if test_path:
            args.append(test_path)

        subprocess.run(args, check=True)
        logger.info("Tests completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Tests failed with exit code {e.returncode}")
        sys.exit(e.returncode)

def cleanup_test_environment() -> None:
    """Clean up test environment."""
    try:
        # Remove test database and artifacts
        if os.path.exists('test.db'):
            os.remove('test.db')
        logger.info("Test environment cleanup completed")
    except Exception as e:
        logger.error(f"Test environment cleanup failed: {e}")

def main():
    """Main entry point."""
    import argparse
    parser = argparse.ArgumentParser(description="Run tests with setup and teardown")
    parser.add_argument('--path', help='Specific test path to run')
    parser.add_argument('--coverage', action='store_true', help='Run with coverage')
    parser.add_argument('--setup-only', action='store_true', help='Only setup test environment')
    parser.add_argument('--no-cleanup', action='store_true', help='Skip cleanup after tests')
    args = parser.parse_args()

    try:
        # Always set up test environment
        setup_test_environment()

        if not args.setup_only:
            # Run tests if not setup-only
            run_tests(args.path, args.coverage)

            if not args.no_cleanup:
                cleanup_test_environment()

    except KeyboardInterrupt:
        logger.info("Test run interrupted")
        if not args.no_cleanup:
            cleanup_test_environment()
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error during test run: {e}")
        if not args.no_cleanup:
            cleanup_test_environment()
        sys.exit(1)

if __name__ == '__main__':
    main()
