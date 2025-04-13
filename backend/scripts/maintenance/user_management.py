#!/usr/bin/env python3
"""
User Management Utility

This script consolidates user management functionality from multiple scripts:
- list_users.py
- update_user.py 
- update_password.py

It provides a command-line interface for common user management tasks.
"""

import os
import sys
import argparse
from werkzeug.security import generate_password_hash

# Add the parent directory to sys.path to allow importing the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app import create_app
    from backend.app.api.models.user import User
    from backend.app.extensions import db
except ImportError as e:
    print(f"Error importing application modules: {e}")
    sys.exit(1)

def list_users():
    """List all users in the database."""
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print("\nUsers in database:")
        if users:
            for user in users:
                print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
        else:
            print("No users found in the database.")
    return users

def update_user_password(username_or_email, new_password):
    """Update a user's password."""
    app = create_app()
    with app.app_context():
        # Find the user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | 
            (User.email == username_or_email)
        ).first()
        
        if not user:
            print(f"User with username or email '{username_or_email}' not found")
            return False
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        print(f"Password updated for user: {user.username} ({user.email})")
        return True

def reset_demo_user():
    """Reset the demo user's password to 'demo123'."""
    try:
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
            
            # Verify the password
            if demo_user.check_password('demo123'):
                print("Password verification successful!")
            else:
                print("Password verification failed!")
            
            return True
    except Exception as e:
        print(f"Error updating demo user: {str(e)}")
        return False

def create_user(username, email, password):
    """Create a new user."""
    app = create_app()
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == username) | 
            (User.email == email)
        ).first()
        
        if existing_user:
            print(f"User with username '{username}' or email '{email}' already exists")
            return False
        
        # Create new user
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            print(f"User created successfully: {username} ({email})")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"Error creating user: {str(e)}")
            return False

def delete_user(username_or_email):
    """Delete a user."""
    app = create_app()
    with app.app_context():
        # Find the user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | 
            (User.email == username_or_email)
        ).first()
        
        if not user:
            print(f"User with username or email '{username_or_email}' not found")
            return False
        
        try:
            # Delete the user (soft delete)
            user.delete()
            print(f"User '{user.username}' ({user.email}) has been deleted")
            return True
        except Exception as e:
            print(f"Error deleting user: {str(e)}")
            return False

def main():
    parser = argparse.ArgumentParser(description='User Management Utility')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # List users command
    list_parser = subparsers.add_parser('list', help='List all users')
    
    # Create user command
    create_parser = subparsers.add_parser('create', help='Create a new user')
    create_parser.add_argument('username', help='Username for the new user')
    create_parser.add_argument('email', help='Email for the new user')
    create_parser.add_argument('password', help='Password for the new user')
    
    # Update password command
    update_parser = subparsers.add_parser('update-password', help='Update user password')
    update_parser.add_argument('username_or_email', help='Username or email of the user')
    update_parser.add_argument('password', help='New password')
    
    # Reset demo user command
    reset_demo_parser = subparsers.add_parser('reset-demo', help='Reset the demo user')
    
    # Delete user command
    delete_parser = subparsers.add_parser('delete', help='Delete a user')
    delete_parser.add_argument('username_or_email', help='Username or email of the user to delete')
    
    args = parser.parse_args()
    
    if args.command == 'list':
        list_users()
    elif args.command == 'create':
        create_user(args.username, args.email, args.password)
    elif args.command == 'update-password':
        update_user_password(args.username_or_email, args.password)
    elif args.command == 'reset-demo':
        reset_demo_user()
    elif args.command == 'delete':
        delete_user(args.username_or_email)
    else:
        parser.print_help()

if __name__ == '__main__':
    main() 