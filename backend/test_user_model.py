#!/usr/bin/env python3
"""Test User model."""

from app.models.user import User
from app.db.session import get_db
from uuid import uuid4

def test_user_model():
    """Test User model initialization and UUID handling."""
    try:
        # Create user with explicit UUID
        user_id = uuid4()
        print(f"Generated UUID: {user_id} (type: {type(user_id)})")

        user = User(
            id=user_id,
            username="testuuid",
            email="testuuid@example.com",
            is_active=True
        )
        user.set_password("Test123!")

        print(f"User ID after initialization: {user.id} (type: {type(user.id)})")

        # Try serialization
        user_dict = user.to_dict()
        print(f"User dict ID: {user_dict['id']} (type: {type(user_dict['id'])})")

        # Try database operations
        with get_db() as db:
            db.add(user)
            print("User added to session")
            db.commit()
            print("Session committed successfully")

            # Fetch from database
            fetched_user = db.query(User).filter_by(id=user_id).first()
            print(f"Fetched user ID: {fetched_user.id} (type: {type(fetched_user.id)})")

            # Clean up
            db.delete(user)
            db.commit()
            print("User deleted successfully")

        return True
    except Exception as e:
        print(f"Error testing User model: {type(e).__name__}: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    test_user_model()
