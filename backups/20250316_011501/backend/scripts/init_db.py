"""Initialize database script."""
from backend.app.db.session import get_db
from backend.app.db.init_db import init_db


def main():
    """Initialize database."""
    with get_db() as db:
        init_db(db)


if __name__ == "__main__":
    main()
