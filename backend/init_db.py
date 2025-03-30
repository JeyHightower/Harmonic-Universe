from app import create_app, db

def init_db():
    app = create_app()
    with app.app_context():
        # Import all models to ensure they are registered with SQLAlchemy
        from app.api.models import (
            User, Note, Universe, Scene, Physics2D, Physics3D,
            PhysicsObject, PhysicsConstraint, SoundProfile,
            AudioSample, MusicPiece, Harmony, MusicalTheme,
            Character
        )
        
        # Create tables if they don't exist
        db.create_all()
        print("Database tables created successfully")

if __name__ == '__main__':
    init_db() 