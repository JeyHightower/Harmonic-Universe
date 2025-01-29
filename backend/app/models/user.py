from . import db
from .association_tables import universe_collaborators, universe_access
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
import jwt
from flask import current_app
import json
from sqlalchemy import event
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, Boolean

class User(UserMixin, db.Model):
    """User model for storing user account information."""

    __tablename__ = 'users'
    __table_args__ = (
        db.Index("idx_email", "email"),
        db.Index("idx_username", "username"),
    )

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    last_login = Column(DateTime)

    # Relationships
    owned_universes = relationship(
        "Universe",
        backref="owner",
        lazy="dynamic",
        cascade="all, delete-orphan",
        foreign_keys="Universe.user_id"
    )

    collaborating_universes = relationship(
        "Universe",
        secondary="universe_collaborators",
        backref=db.backref("collaborators", lazy="dynamic"),
        lazy="dynamic"
    )

    accessible_universes = relationship(
        "Universe",
        secondary="universe_access",
        backref=db.backref("accessible_by", lazy="dynamic"),
        lazy="dynamic"
    )

    profile = db.relationship('Profile', backref='user', uselist=False)
    # Relationships with Universe model are set up in relationships.py

    def __init__(self, username, email, password=None):
        """Initialize user."""
        self.username = username
        self.email = email
        if password:
            self.set_password(password)

    def set_password(self, password):
        """Set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password."""
        return check_password_hash(self.password_hash, password)

    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login = datetime.now(timezone.utc)
        db.session.commit()

    def deactivate(self):
        """Deactivate user account"""
        self.is_active = False
        db.session.commit()

    def activate(self):
        """Activate user account"""
        self.is_active = True
        db.session.commit()

    def update(self, data):
        """Update user attributes"""
        for key, value in data.items():
            if hasattr(self, key) and key not in ['id', 'password_hash']:
                if key == 'password':
                    self.set_password(value)
                else:
                    setattr(self, key, value)
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()

    def get_id(self):
        """Return the user ID as a string (required for Flask-Login)"""
        return str(self.id)

    def __str__(self):
        return f'<User {self.username}>'

    def __repr__(self):
        """String representation."""
        return f"<User(id={self.id}, username='{self.username}')>"

    def get_jwt_identity(self):
        """Return the identity for JWT tokens"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

    @property
    def universes(self):
        """Get all universes (owned + collaborating)"""
        owned = self.owned_universes.all()
        collab = self.collaborating_universes.all()
        return list(set(owned + collab))

    def to_dict(self):
        """Convert user to dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None
        }

    def __json__(self):
        """Return a JSON serializable representation of the user"""
        return self.to_dict()

    def __json_encode__(self):
        """Make the object JSON serializable"""
        return self.to_dict()

    def generate_auth_token(self, expires_in=3600):
        """Generate JWT token"""
        return jwt.encode(
            {'user_id': self.id, 'exp': datetime.utcnow() + timedelta(seconds=expires_in)},
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )

    @staticmethod
    def verify_auth_token(token):
        """Verify JWT token"""
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            return User.query.get(data['user_id'])
        except:
            return None

    def can_access(self, universe):
        """Check if user can access universe."""
        return (universe.is_public or
                universe.user_id == self.id or
                universe in self.accessible_universes)

    def can_modify(self, universe):
        """Check if user can modify universe."""
        return universe.user_id == self.id

    def grant_access(self, universe):
        """Grant access to universe."""
        if universe not in self.accessible_universes:
            self.accessible_universes.append(universe)

    def revoke_access(self, universe):
        """Revoke access to universe."""
        if universe in self.accessible_universes:
            self.accessible_universes.remove(universe)

# Event listener to handle user deletion
@event.listens_for(User, 'before_delete')
def handle_user_deletion(mapper, connection, target):
    """Handle cleanup when a user is deleted"""
    # Update user_id to None for all universes created by this user
    connection.execute(
        db.text('UPDATE universes SET user_id = NULL WHERE user_id = :user_id'),
        {'user_id': target.id}
    )
