#!/usr/bin/env python
"""
Script to reset the demo user's password hash.
"""

import os
import sys
from app import create_app
from app.api.models.user import User
from app.extensions import db
from werkzeug.security import generate_password_hash

def reset_demo_user():
    """Reset the demo user's password to 'demo123'."""
    try:
        # Create the app context
        app = create_app()
        with app.app_context():
            # Find the demo user
            demo_user = User.query.filter_by(username='demo').first()
            
            if not demo_user:
                print("Demo user not found. Creating demo user...")
                demo_user = User(
                    username='demo',
                    email='demo@example.com'
                )
                db.session.add(demo_user)
            
            # Set password to 'demo123'
            demo_user.set_password('demo123')
            
            # Commit the changes
            db.session.commit()
            
            print(f"Demo user updated successfully!")
            print(f"Username: {demo_user.username}")
            print(f"Email: {demo_user.email}")
            print(f"Password hash: {demo_user.password_hash}")
            
            # Verify the password
            if demo_user.check_password('demo123'):
                print("Password verification successful!")
            else:
                print("Password verification failed!")
            
            return True
    except Exception as e:
        print(f"Error updating demo user: {str(e)}")
        return False

if __name__ == "__main__":
    success = reset_demo_user()
    sys.exit(0 if success else 1) 