from . import db, users_universes
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    user_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    _hashed_password: Mapped[str] = mapped_column(String(250), nullable=False)
    bio: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    universes: Mapped[List['Universe']] = relationship(secondary='users_universes', back_populates='members')
    
    @property
    def password(self):
        raise AttributeError('Password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self._hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self._hashed_password, password)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'username': self.username,
            'email': self.email,
            'bio': self.bio,
            'created_at': self.created_at.isoformat()
        }

