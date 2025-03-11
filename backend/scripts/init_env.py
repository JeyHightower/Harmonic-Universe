#!/usr/bin/env python3
"""Environment initialization script."""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


class EnvironmentSetup:
    """Handles environment setup for the backend."""

    def __init__(self, root_dir: str = None):
        """Initialize with root directory."""
        self.root_dir = Path(root_dir or os.path.dirname(os.path.dirname(__file__)))
        self.required_dirs = [
            "logs",
            "uploads/audio",
            "uploads/exports",
            "uploads/temp",
            "reports",
            "migrations/versions",
            "tests/unit",
            "tests/integration",
            "tests/e2e",
            "app/api/v1/endpoints",
            "app/models/audio",
            "app/models/physics",
            "app/models/visualization",
            "app/schemas/audio",
            "app/schemas/physics",
            "app/schemas/visualization",
            "app/services/audio",
            "app/services/physics",
            "app/services/visualization",
            "docs/source",
            "docs/build",
        ]
        self.required_files = [
            ".env",
            ".env.example",
            "requirements.txt",
            "requirements-test.txt",
            "pytest.ini",
            ".coveragerc",
            "alembic.ini",
        ]

    def create_directories(self) -> None:
        """Create all required directories."""
        for dir_path in self.required_dirs:
            full_path = self.root_dir / dir_path
            try:
                full_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"Created directory: {dir_path}")
            except Exception as e:
                logger.error(f"Failed to create directory {dir_path}: {str(e)}")

    def check_files(self) -> List[str]:
        """Check for required files and return missing ones."""
        missing_files = []
        for file_path in self.required_files:
            if not (self.root_dir / file_path).exists():
                missing_files.append(file_path)
        return missing_files

    def setup_virtual_env(self) -> bool:
        """Set up virtual environment if it doesn't exist."""
        venv_path = self.root_dir / "venv"
        if venv_path.exists():
            logger.info("Virtual environment already exists")
            return True

        try:
            subprocess.run([sys.executable, "-m", "venv", str(venv_path)], check=True)
            logger.info("Created virtual environment")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to create virtual environment: {str(e)}")
            return False

    def install_dependencies(self) -> bool:
        """Install project dependencies."""
        pip_path = self.root_dir / "venv" / "bin" / "pip"
        if not pip_path.exists():
            pip_path = self.root_dir / "venv" / "Scripts" / "pip"  # Windows

        try:
            # Install main dependencies
            subprocess.run(
                [str(pip_path), "install", "-r", "requirements.txt"], check=True
            )
            # Install test dependencies
            subprocess.run(
                [str(pip_path), "install", "-r", "requirements-test.txt"], check=True
            )
            logger.info("Installed dependencies")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install dependencies: {str(e)}")
            return False

    def verify_setup(self) -> Dict[str, bool]:
        """Verify the environment setup."""
        return {
            "directories": all(
                (self.root_dir / dir_path).exists() for dir_path in self.required_dirs
            ),
            "files": len(self.check_files()) == 0,
            "venv": (self.root_dir / "venv").exists(),
            "dependencies": (self.root_dir / "venv" / "lib").exists()
            or (self.root_dir / "venv" / "Lib").exists(),  # Windows
        }

    def setup(self) -> bool:
        """Run complete environment setup."""
        try:
            logger.info("Starting environment setup...")

            # Create directories
            self.create_directories()

            # Check for missing files
            missing_files = self.check_files()
            if missing_files:
                logger.warning(f"Missing required files: {', '.join(missing_files)}")

            # Setup virtual environment
            if not self.setup_virtual_env():
                return False

            # Install dependencies
            if not self.install_dependencies():
                return False

            # Verify setup
            verification = self.verify_setup()
            all_verified = all(verification.values())

            if all_verified:
                logger.info("Environment setup completed successfully")
            else:
                failed = [k for k, v in verification.items() if not v]
                logger.error(
                    f"Setup incomplete. Failed verifications: {', '.join(failed)}"
                )

            return all_verified

        except Exception as e:
            logger.error(f"Setup failed: {str(e)}")
            return False


def main():
    """Main entry point."""
    setup = EnvironmentSetup()
    success = setup.setup()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
