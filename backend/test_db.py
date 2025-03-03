#!/usr/bin/env python3
"""Test database connection."""

from app.db.session import get_db
from app.models.user import User

def test_db_connection():
    """Test database connection."""
    try:
        with get_db() as db:
            # Try a simple query
            users = db.query(User).all()
            print(f"Database connection successful. Found {len(users)} users.")
            return True
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_db_connection()
