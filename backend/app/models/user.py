from datetime import datetime, timedelta
from sqlalchemy import Column, String, Boolean, DateTime, UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
from app.core.pwd_context import get_password_hash, verify_password

class User(BaseModel):
    """User model."""
    __tablename__ = "users"

    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    is_verified = Column(Boolean(), default=False)
    verification_token = Column(String(255), unique=True, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    reset_token = Column(String(255), unique=True, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    refresh_token = Column(String(255), unique=True, nullable=True)
    refresh_token_expires = Column(DateTime, nullable=True)
    color = Column(String(7), nullable=True)

    # Relationships
    universes = relationship(
        'Universe',
        back_populates='user',
        cascade='all, delete-orphan',
        primaryjoin='User.id == Universe.user_id'
    )
    scenes = relationship('Scene', back_populates='creator')
    activities = relationship('Activity', back_populates='user')
    projects = relationship('Project', secondary='project_users', back_populates='users')
    audio_files = relationship('AudioFile', back_populates='user', cascade='all, delete-orphan')
    visualizations = relationship('Visualization', back_populates='user', cascade='all, delete-orphan')
    physics_objects = relationship('PhysicsObject', back_populates='user', cascade='all, delete-orphan')
    ai_models = relationship('AIModel', back_populates='user', cascade='all, delete-orphan')

    def set_password(self, password):
        """Set password hash."""
        self.password_hash = get_password_hash(password)

    def check_password(self, password):
        """Check password against hash."""
        return verify_password(password, self.password_hash)

    def generate_verification_token(self):
        """Generate email verification token."""
        from secrets import token_urlsafe
        self.verification_token = token_urlsafe(32)
        self.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        return self.verification_token

    def generate_reset_token(self):
        """Generate password reset token."""
        from secrets import token_urlsafe
        self.reset_token = token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token

    def generate_refresh_token(self):
        """Generate refresh token."""
        from secrets import token_urlsafe
        self.refresh_token = token_urlsafe(32)
        self.refresh_token_expires = datetime.utcnow() + timedelta(days=7)
        return self.refresh_token

    def verify_email(self):
        """Mark email as verified."""
        self.is_verified = True
        self.verification_token = None
        self.verification_token_expires = None

    def to_dict(self):
        """Convert user instance to dictionary."""
        base_dict = super().to_dict()
        user_dict = {
            'email': self.email,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
        }
        return {**base_dict, **user_dict}
