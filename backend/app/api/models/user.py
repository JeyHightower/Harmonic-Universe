from werkzeug.security import generate_password_hash, check_password_hash
from .base import BaseModel
from ...extensions import db
from .universe import Universe
from .note import Note
from .audio import SoundProfile, AudioSample, MusicPiece

class User(BaseModel):
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255))
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
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted,
            'version': self.version
        }
        
    def get_stats(self):
        """Get user statistics."""
        from sqlalchemy import func
        
        return {
            'universes_count': db.session.query(func.count(Universe.id)).filter_by(user_id=self.id, is_deleted=False).scalar() or 0,
            'notes_count': db.session.query(func.count(Note.id)).filter_by(user_id=self.id, is_deleted=False).scalar() or 0,
            'sound_profiles_count': db.session.query(func.count(SoundProfile.id)).filter_by(user_id=self.id, is_deleted=False).scalar() or 0,
            'audio_samples_count': db.session.query(func.count(AudioSample.id)).filter_by(user_id=self.id, is_deleted=False).scalar() or 0,
            'music_pieces_count': db.session.query(func.count(MusicPiece.id)).filter_by(user_id=self.id, is_deleted=False).scalar() or 0
        }
        
    @classmethod
    def get_by_username(cls, username):
        """Get user by username."""
        return cls.query.filter_by(username=username, is_deleted=False).first()
        
    @classmethod
    def get_by_email(cls, email):
        """Get user by email."""
        return cls.query.filter_by(email=email, is_deleted=False).first() 