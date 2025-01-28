#!/usr/bin/env python3
import os
import sys
import subprocess
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('cleanup.log')
    ]
)
logger = logging.getLogger(__name__)

def run_command(command: str, cwd: str = None, env: dict = None) -> bool:
    """Run a shell command and return True if successful."""
    try:
        logger.info(f"Running command: {command}")
        logger.info(f"Working directory: {cwd}")

        # Merge environment variables
        cmd_env = os.environ.copy()
        if env:
            cmd_env.update(env)

        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            env=cmd_env,
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}")
        logger.error(f"Error output: {e.stderr}")
        return False

def setup_backend(root_dir: Path) -> bool:
    """Set up Python backend environment."""
    logger.info("Setting up backend environment...")

    backend_dir = root_dir / 'backend'
    venv_dir = backend_dir / 'venv'

    # Create virtual environment if it doesn't exist
    if not venv_dir.exists():
        if not run_command("python -m venv venv", cwd=str(backend_dir)):
            return False

    # Install requirements
    requirements = [
        'requirements.txt',
        'requirements-dev.txt',
        'requirements-test.txt'
    ]

    # Use the appropriate pip command based on OS
    pip_cmd = "venv/bin/pip" if os.name != 'nt' else "venv\\Scripts\\pip"

    for req_file in requirements:
        req_path = backend_dir / req_file
        if req_path.exists():
            if not run_command(f"{pip_cmd} install -r {req_file}", cwd=str(backend_dir)):
                return False

    return True

def setup_frontend(root_dir: Path) -> bool:
    """Set up Node.js frontend environment."""
    logger.info("Setting up frontend environment...")

    frontend_dir = root_dir / 'frontend'

    # Install dependencies
    if not run_command("npm install", cwd=str(frontend_dir)):
        return False

    return True

def run_cleanup_tasks(root_dir: Path) -> bool:
    """Run all cleanup tasks."""
    try:
        # 1. Set up environments
        if not setup_backend(root_dir):
            logger.error("Failed to set up backend environment")
            return False

        if not setup_frontend(root_dir):
            logger.error("Failed to set up frontend environment")
            return False

        # 2. Run codebase cleanup
        cleanup_script = root_dir / 'scripts' / 'codebase_cleanup.py'
        if not run_command(f"python {cleanup_script} {root_dir}"):
            logger.error("Failed to run codebase cleanup")
            return False

        # 3. Update database
        backend_dir = root_dir / 'backend'
        flask_env = {
            'FLASK_APP': 'app',
            'FLASK_ENV': 'development',
            'PATH': f"{backend_dir}/venv/bin:{os.environ['PATH']}"
        }

        if not run_command("flask db upgrade", cwd=str(backend_dir), env=flask_env):
            logger.error("Failed to run database migrations")
            return False

        # 4. Run backend tests
        if not run_command(f"venv/bin/pytest", cwd=str(backend_dir)):
            logger.warning("Some backend tests failed")

        # 5. Run frontend tests
        frontend_dir = root_dir / 'frontend'
        if not run_command("npm test", cwd=str(frontend_dir)):
            logger.warning("Some frontend tests failed")

        # 6. Build frontend
        if not run_command("npm run build", cwd=str(frontend_dir)):
            logger.error("Failed to build frontend")
            return False

        logger.info("All cleanup tasks completed successfully!")
        return True

    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return False

def main():
    """Main entry point."""
    if len(sys.argv) != 2:
        print("Usage: python cleanup.py <root_directory>")
        sys.exit(1)

    root_dir = Path(sys.argv[1])
    if not root_dir.is_dir():
        print(f"Error: {root_dir} is not a directory")
        sys.exit(1)

    success = run_cleanup_tasks(root_dir)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

