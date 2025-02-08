from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from .base import BaseModel

class User(BaseModel):
    """User model for authentication and authorization."""
    __tablename__ = 'users'

    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)
    color = db.Column(db.String(7), default='#1976d2')  # Default color for collaboration

    # Relationships
    universes = db.relationship('Universe', back_populates='user', lazy='dynamic')
    audio_files = db.relationship('AudioFile', back_populates='user', lazy='dynamic')
    visualizations = db.relationship('Visualization', back_populates='user', lazy='dynamic')
    ai_models = db.relationship('AIModel', back_populates='user', lazy='dynamic')

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_auth_token(self):
        """Generate an authentication token for the user."""
        from flask_jwt_extended import create_access_token
        return create_access_token(identity=self.id)

    def to_dict(self):
        return {
            **super().to_dict(),
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'color': self.color
        }

    def __repr__(self):
        return f'<User {self.username}>'
