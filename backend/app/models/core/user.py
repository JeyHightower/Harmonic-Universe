from datetime import datetime
from .base import BaseModel
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from flask_login import UserMixin
from app import bcrypt

class User(BaseModel, UserMixin):
    """User model for authentication and authorization."""
    __tablename__ = 'users'

    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    color = Column(String(7), nullable=False, default='#000000')  # For collaboration
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universes = relationship('Universe', back_populates='user')
    audio_files = relationship('AudioFile', back_populates='user')
    visualizations = relationship('Visualization', back_populates='user')
    physics_objects = relationship('PhysicsObject', back_populates='user')
    ai_models = relationship('AIModel', back_populates='user')

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def generate_auth_token(self):
        """Generate an authentication token for the user."""
        from flask_jwt_extended import create_access_token
        return create_access_token(identity=self.id)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'color': self.color,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<User {self.username}>'
