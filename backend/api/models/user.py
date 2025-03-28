from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from ..database import db
from .base import BaseModel

class User(UserMixin, BaseModel):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    
    # Relationships with cascade delete
    notes = db.relationship('Note', backref=db.backref('author', lazy=True), cascade='all, delete-orphan')
    universes = db.relationship('Universe', backref=db.backref('creator', lazy=True), cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref=db.backref('creator', lazy=True), cascade='all, delete-orphan')
    harmonies = db.relationship('Harmony', backref=db.backref('creator', lazy=True), cascade='all, delete-orphan')
    audio_samples = db.relationship('AudioSample', backref=db.backref('uploader', lazy=True), cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'username': self.username,
            'email': self.email
        })
        return base_dict 