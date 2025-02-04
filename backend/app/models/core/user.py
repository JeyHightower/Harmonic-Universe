"""
User model.
"""

from typing import Dict, Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from passlib.context import CryptContext
import jwt
import uuid
import secrets
from datetime import datetime, timedelta

from app.db.base_model import Base, GUID
from app.core.config import settings
from pydantic import BaseModel
from app.core.security import get_password_hash, verify_password
from app.models.organization.storyboard import Storyboard

if TYPE_CHECKING:
    from app.models.core.universe import Universe
    from app.models.core.scene import Scene
    from app.models.audio.audio_file import AudioFile
    from app.models.ai.ai_generation import AIGeneration

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    """User model."""
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    # Primary fields
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=False)

    # User-specific fields
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_password_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_password_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scenes = relationship("Scene", back_populates="creator")
    universes = relationship("Universe", back_populates="creator")
    storyboards = relationship("Storyboard", back_populates="creator")
    audio_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile",
        back_populates="creator",
        cascade="all, delete-orphan"
    )
    ai_generations: Mapped[List["AIGeneration"]] = relationship(
        "AIGeneration",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __init__(self, **kwargs):
        """Initialize user."""
        if 'password' in kwargs:
            kwargs['hashed_password'] = pwd_context.hash(kwargs.pop('password'))
        kwargs.setdefault('created_at', datetime.utcnow())
        kwargs.setdefault('updated_at', datetime.utcnow())
        super().__init__(**kwargs)

    @property
    def password(self):
        """Password getter."""
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password: str):
        """Password setter."""
        self.hashed_password = pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify password."""
        return pwd_context.verify(password, self.hashed_password)

    def get_token(self) -> str:
        """Generate authentication token."""
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.utcnow() + expires_delta

        to_encode = {
            "exp": expire,
            "sub": str(self.id),
            "email": self.email,
            "is_superuser": self.is_superuser
        }
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt

    def generate_email_verification_token(self) -> str:
        """Generate email verification token."""
        self.verification_token = secrets.token_urlsafe(32)
        return self.verification_token

    def verify_email(self, token: str) -> bool:
        """Verify email with token."""
        if self.verification_token == token:
            self.email_verified = True
            self.verification_token = None
            return True
        return False

    def __repr__(self) -> str:
        """String representation."""
        return f"<User {self.email}>"

class UserResponseModel(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: str
    is_active: bool
    is_superuser: bool
    last_login: Optional[datetime]
    email_verified: bool

    class Config:
        from_attributes = True
