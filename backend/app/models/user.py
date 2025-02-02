"""
User model.
"""

from datetime import datetime, timedelta
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import uuid
import secrets

from app.core.config import settings
from app.db.base_class import Base, GUID

if TYPE_CHECKING:
    from app.models.audio_file import AudioFile
    from app.models.universe import Universe
    from app.models.scene import Scene
    from app.models.storyboard import Storyboard

class User(Base):
    """User model."""
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    # Override id from Base to use GUID type
    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)

    # User-specific fields
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean(), default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean(), default=False)
    verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_password_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_password_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    universes: Mapped[List["Universe"]] = relationship(
        "Universe",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    scenes: Mapped[List["Scene"]] = relationship(
        "Scene",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    audio_files: Mapped[List["AudioFile"]] = relationship(
        "AudioFile",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    storyboards: Mapped[List["Storyboard"]] = relationship(
        "Storyboard",
        back_populates="creator",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __init__(self, **kwargs):
        """Initialize a new User instance."""
        super().__init__(**kwargs)

    @property
    def password(self):
        """Prevent password from being accessed."""
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        """Hash password on setting."""
        self.hashed_password = generate_password_hash(password)

    def verify_password(self, password: str) -> bool:
        """Check if password matches."""
        return check_password_hash(self.hashed_password, password)

    def generate_auth_token(self, expires_delta: Optional[timedelta] = None) -> str:
        """Generate auth token."""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode = {
            'exp': expire,
            'sub': str(self.id),
            'username': self.username,
            'email': self.email,
            'is_superuser': self.is_superuser
        }

        return jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

    @staticmethod
    def verify_auth_token(token: str, db) -> Optional['User']:
        """Verify auth token."""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get('sub')
            if user_id is None:
                return None
            return db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        except jwt.ExpiredSignatureError:
            return None
        except jwt.JWTError:
            return None

    def generate_email_verification_token(self) -> str:
        """Generate email verification token."""
        self.verification_token = secrets.token_urlsafe(32)
        return self.verification_token

    def generate_password_reset_token(self) -> str:
        """Generate password reset token."""
        self.reset_password_token = secrets.token_urlsafe(32)
        self.reset_password_expires = datetime.utcnow() + timedelta(hours=24)
        return self.reset_password_token

    def verify_email(self, token: str) -> bool:
        """Verify email with token."""
        if self.verification_token == token:
            self.email_verified = True
            self.verification_token = None
            return True
        return False

    def verify_reset_password_token(self, token: str) -> bool:
        """Verify password reset token."""
        if (self.reset_password_token == token and
            self.reset_password_expires and
            self.reset_password_expires > datetime.utcnow()):
            return True
        return False

    def get_token(self, expires_delta: Optional[timedelta] = None) -> str:
        """Alias for generate_auth_token for backward compatibility."""
        return self.generate_auth_token(expires_delta)

    def __repr__(self) -> str:
        """Return string representation."""
        return f'<User {self.email}>'
