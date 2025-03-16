"""Initial data seeding script."""

import logging
from app.db.init_db import init_db
from app.db.session import get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init() -> None:
    """Initialize database with initial data."""
    with get_db() as db:
        init_db(db)

def main() -> None:
    """Main entry point."""
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
