#!/usr/bin/env python
from app import create_app, db
from app.models import User, Universe

# Create the app
app = create_app()

# Initialize the database
with app.app_context():
    db.create_all()
    print("Database tables created successfully")
