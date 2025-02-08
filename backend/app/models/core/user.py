from datetime import datetime
from .base import BaseModel
from sqlalchemy import Column, String, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from flask_login import UserMixin
from app.core.pwd_context import get_password_hash, verify_password
import uuid

class User(BaseModel, UserMixin):
    """User model for authentication and authorization."""
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    color = Column(String(7), nullable=False, default='#000000')  # For collaboration
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    universes = relationship('Universe', back_populates='user', cascade="all, delete-orphan")
    scenes = relationship('Scene', back_populates='creator', cascade="all, delete-orphan")
    audio_files = relationship('AudioFile', back_populates='user', cascade="all, delete-orphan")
    visualizations = relationship('Visualization', back_populates='user', cascade="all, delete-orphan")
    projects = relationship('Project', secondary='project_users', back_populates='users')
    physics_objects = relationship('PhysicsObject', back_populates='user')
    ai_models = relationship('AIModel', back_populates='user')

    def __init__(self, **kwargs):
        """Initialize user."""
        if 'password' in kwargs:
            kwargs['password_hash'] = get_password_hash(kwargs.pop('password'))
        super().__init__(**kwargs)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = get_password_hash(password)

    def check_password(self, password):
        return verify_password(password, self.password_hash)

    def generate_auth_token(self):
        """Generate an authentication token for the user."""
        from flask_jwt_extended import create_access_token
        return create_access_token(identity=self.id)

    def to_dict(self):
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<User {self.username}>'
