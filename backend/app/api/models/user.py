from werkzeug.security import generate_password_hash, check_password_hash
from .base import BaseModel
from app.extensions import db

class User(BaseModel):
    __tablename__ = 'users'
    
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    version = db.Column(db.Integer, nullable=False, default=1)
    
    # Relationships
    notes = db.relationship('Note', backref='user', lazy=True, cascade='all, delete-orphan')
    universes = db.relationship('Universe', backref='user', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='user', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='user', lazy=True, cascade='all, delete-orphan')
    sound_profiles = db.relationship('SoundProfile', backref='user', lazy=True, cascade='all, delete-orphan')
    audio_samples = db.relationship('AudioSample', backref='user', lazy=True, cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, username=None, email=None):
        super().__init__()
        self.username = username
        self.email = email
    
    def set_password(self, password):
        """Set the user's password hash."""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Check if the provided password matches the hash."""
        return check_password_hash(self.password_hash, password)
    
    def validate(self):
        """Validate user data."""
        if not self.username or len(self.username) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if not self.email or '@' not in self.email:
            raise ValueError("Invalid email address")
        if not self.password_hash:
            raise ValueError("Password must be set")
            
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted,
            'version': self.version
        }
        
    def get_stats(self):
        """Get user statistics."""
        return {
            'universes_count': len(self.universes),
            'notes_count': len(self.notes),
            'sound_profiles_count': len(self.sound_profiles),
            'audio_samples_count': len(self.audio_samples),
            'music_pieces_count': len(self.music_pieces)
        }
        
    @classmethod
    def get_by_username(cls, username):
        """Get user by username."""
        return cls.query.filter_by(username=username, is_deleted=False).first()
        
    @classmethod
    def get_by_email(cls, email):
        """Get user by email."""
        return cls.query.filter_by(email=email, is_deleted=False).first() 