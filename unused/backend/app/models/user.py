"""User model."""
from datetime import datetime, timezone
from ..extensions import db
from sqlalchemy.orm import relationship
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from flask import current_app
from .base import BaseModel


class User(BaseModel):
    """User model for storing user related details."""

    __tablename__ = "users"
    __table_args__ = (
        db.Index("idx_email", "email"),
        db.Index("idx_username", "username"),
        db.Index("idx_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login = Column(DateTime, default=datetime.utcnow)

    # Relationships
    universes = relationship("Universe", back_populates="user", lazy=True)
    universe_collaborations = relationship(
        "UniverseCollaborator", back_populates="user", lazy=True
    )
    comments = relationship("Comment", back_populates="user", lazy=True)
    favorites = relationship("Favorite", back_populates="user", lazy=True)
    profile = relationship("Profile", back_populates="user", uselist=False, lazy=True)
    versions = relationship("Version", back_populates="creator", lazy=True)
    storyboards = relationship("Storyboard", back_populates="user", lazy=True)
    templates = relationship("Template", back_populates="user", lazy=True)

    def __init__(self, username: str, email: str, password: str = None):
        """Initialize user."""
        self.username = username
        self.email = email
        if password:
            self.set_password(password)

    @property
    def password(self):
        """Prevent password from being accessed."""
        raise AttributeError("password is not a readable attribute")

    @password.setter
    def password(self, password):
        """Set password."""
        self.set_password(password)

    def set_password(self, password: str) -> None:
        """Set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Check password."""
        return check_password_hash(self.password_hash, password)

    def get_reset_password_token(self, expires_in=3600):
        """Generate password reset token."""
        return jwt.encode(
            {
                "reset_password": self.id,
                "exp": datetime.utcnow() + timedelta(seconds=expires_in),
            },
            current_app.config["SECRET_KEY"],
            algorithm="HS256",
        )

    @staticmethod
    def verify_reset_password_token(token):
        """Verify password reset token."""
        try:
            id = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )["reset_password"]
        except:
            return None
        return User.query.get(id)

    def save(self):
        """Save user to database."""
        db.session.add(self)
        db.session.commit()

    def update(self, **kwargs):
        """Update user attributes."""
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.commit()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "universes_count": len(self.universes),
            "collaborations_count": len(self.universe_collaborations),
            "comments_count": len(self.comments),
            "favorites_count": len(self.favorites),
            "profile": self.profile.to_dict() if self.profile else None,
        }

    def __repr__(self):
        """String representation."""
        return f"<User {self.username}>"

    @staticmethod
    def validate_username(username):
        if not 3 <= len(username) <= 30:
            return False, "Username must be between 3 and 30 characters"
        if not username.replace("_", "").replace("-", "").isalnum():
            return (
                False,
                "Username can only contain letters, numbers, underscores, and hyphens",
            )
        return True, None

    @staticmethod
    def validate_email(email):
        if not email or "@" not in email:
            return False, "Invalid email format"
        return True, None

    @staticmethod
    def validate_password(password):
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        if not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            return False, "Password must contain at least one special character"
        return True, None
