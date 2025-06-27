#!/usr/bin/env python3
"""
Development script to drop all tables and recreate them for a clean slate.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')

from app import create_app
from app.extensions import db

def reset_database():
    app = create_app()
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        print("Database reset complete.")

if __name__ == '__main__':
    reset_database()
