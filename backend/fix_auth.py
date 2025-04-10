#!/usr/bin/env python3
"""
Fix authentication issues by resetting a test user
"""
from app import create_app
from app.api.models.user import User
from app.extensions import db
from werkzeug.security import generate_password_hash
import sys

def create_or_reset_test_user(email="test@example.com", username="testuser", password="password123"):
    """Create or reset a test user for authentication testing"""
    print(f"Attempting to create/reset user: {username} ({email})")
    
    app = create_app()
    with app.app_context():
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User '{username}' with email '{email}' already exists. Resetting password...")
            user.set_password(password)
            db.session.commit()
            print(f"Password for user '{username}' has been reset.")
        else:
            print(f"Creating new user '{username}' with email '{email}'...")
            user = User(username=username, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            print(f"User '{username}' with email '{email}' created successfully.")
        
        # Verify all users in database
        all_users = User.query.all()
        print(f"\nAll users in database ({len(all_users)}):")
        for u in all_users:
            print(f"- {u.username} ({u.email})")

if __name__ == "__main__":
    if len(sys.argv) > 3:
        create_or_reset_test_user(
            email=sys.argv[1],
            username=sys.argv[2],
            password=sys.argv[3]
        )
    elif len(sys.argv) > 1:
        create_or_reset_test_user(email=sys.argv[1])
    else:
        # Create default test user
        create_or_reset_test_user()
        
        # Also create the user that was attempted in the logs
        create_or_reset_test_user("jey@example.io", "jey", "password123") 