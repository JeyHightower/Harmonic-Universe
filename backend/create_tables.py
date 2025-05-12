from app import create_app
from app.extensions import db
from app.api.models.user import User
from app.api.models.universe import Universe
from app.api.models.note import Note
from app.api.models.audio import SoundProfile, AudioSample, MusicPiece

def create_tables():
    """Create all database tables."""
    app = create_app()
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating tables: {str(e)}")
            raise

if __name__ == '__main__':
    create_tables()
