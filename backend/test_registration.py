#!/usr/bin/env python3
"""Test user registration."""

import time
import uuid
from app.db.session import get_db
from app.models.user import User
from app.core.pwd_context import get_password_hash

def test_user_registration():
    """Test user registration."""
    try:
        # Generate unique user data
        unique_id = str(uuid.uuid4())[:8]
        username = f"testuser_{unique_id}"
        email = f"testuser_{unique_id}@example.com"
        password = "Test123!"

        print(f"Attempting to register user: {username} ({email})")

        with get_db() as db:
            # Check if user already exists
            existing_user = db.query(User).filter_by(email=email).first()
            if existing_user:
                print(f"User with email {email} already exists")
                return False

            existing_user = db.query(User).filter_by(username=username).first()
            if existing_user:
                print(f"User with username {username} already exists")
                return False

            # Create new user
            user = User(
                email=email,
                username=username,
                is_active=True
            )
            user.set_password(password)

            # Add user to database
            db.add(user)
            db.commit()

            print(f"User registered successfully: {user.id}")

            # Verify user exists
            new_user = db.query(User).filter_by(email=email).first()
            if new_user:
                print(f"User verification successful: {new_user.id}")
                return True
            else:
                print("User verification failed")
                return False
    except Exception as e:
        print(f"Registration failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_user_registration()
