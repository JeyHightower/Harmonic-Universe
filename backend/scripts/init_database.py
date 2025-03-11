"""Initialize database script."""
import os
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from backend.app.db.session import get_db
from backend.app.db.init_db import init_db


def main():
    """Initialize database."""
    with get_db() as db:
        init_db(db)


if __name__ == "__main__":
    main()
