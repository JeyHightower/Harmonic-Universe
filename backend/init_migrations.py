#!/usr/bin/env python3
import os
from flask_migrate import Migrate
from app import create_app, db

"""
This script initializes database migrations for the Flask application.
It resolves the "Error: No such command 'db'" issue by ensuring
Flask-Migrate is properly set up.
"""

app = create_app()
migrate = Migrate(app, db)

if __name__ == "__main__":
    print("Flask-Migrate initialized successfully.")
    print("You can now run Flask migration commands.")
    print("Example: flask db init")
    print("Example: flask db migrate -m 'initial migration'")
    print("Example: flask db upgrade") 