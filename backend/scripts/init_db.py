from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from app import create_app
from app.models import db

app = create_app('development')

with app.app_context():
    # Ensure instance directory exists
    os.makedirs('instance', exist_ok=True)

    # Create database tables
    db.create_all()
    print("Database tables created successfully")

