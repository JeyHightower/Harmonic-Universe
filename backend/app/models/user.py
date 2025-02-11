from datetime import datetime, timedelta
from sqlalchemy import Column, String, Boolean, DateTime
from .base import BaseModel
from werkzeug.security import check_password_hash, generate_password_hash

class User(BaseModel):
    """User model."""

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

    def set_password(self, password):
        """Set password hash."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password against hash."""
        return check_password_hash(self.password_hash, password)

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
