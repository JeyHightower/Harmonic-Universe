#!/usr/bin/env python3
"""Script to run alembic migrations with proper environment setup."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Explicitly set the database URL for local development
os.environ['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/harmonic_universe'

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Import after environment variables are loaded
from alembic.config import Config
from alembic import command

def main():
    """Run alembic command with proper configuration."""
    # Create Alembic configuration
    alembic_cfg = Config("alembic.ini")

    # Get the command from command line arguments
    if len(sys.argv) < 2:
        print("Usage: python run_migration.py <command> [args]")
        sys.exit(1)

    cmd = sys.argv[1]
    args = sys.argv[2:]

    try:
        if cmd == "revision":
            if "--autogenerate" in args:
                message = args[args.index("-m") + 1] if "-m" in args else ""
                command.revision(alembic_cfg, message, autogenerate=True)
            else:
                message = args[args.index("-m") + 1] if "-m" in args else ""
                command.revision(alembic_cfg, message)
        elif cmd == "upgrade":
            revision = args[0] if args else "head"
            command.upgrade(alembic_cfg, revision)
        elif cmd == "downgrade":
            revision = args[0] if args else "-1"
            command.downgrade(alembic_cfg, revision)
        elif cmd == "current":
            command.current(alembic_cfg)
        elif cmd == "history":
            command.history(alembic_cfg)
        elif cmd == "stamp":
            revision = args[0] if args else "head"
            command.stamp(alembic_cfg, revision)
        else:
            print(f"Unknown command: {cmd}")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
