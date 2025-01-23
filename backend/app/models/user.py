"""User model."""
from app.extensions import db
from datetime import datetime, timedelta
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from flask import current_app

class User(db.Model):
    """User model for authentication and profile management."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universes = relationship('Universe', back_populates='user')
    comments = relationship('Comment', back_populates='user')
    favorites = relationship('Favorite', back_populates='user', overlaps="favorite_universes")
    favorite_universes = relationship('Universe', secondary='favorites',
                                    back_populates='favorited_by',
                                    overlaps="favorites")
    storyboards = relationship('Storyboard', back_populates='user')
    versions = relationship('Version', back_populates='creator')
    templates = relationship('Template', back_populates='creator')

    def __init__(self, username, email, password=None, **kwargs):
        """Initialize user with username, email, and optional password."""
        super(User, self).__init__(**kwargs)
        self.username = username
        self.email = email
        if password:
            self.set_password(password)

    @property
    def password(self):
        """Prevent password from being accessed."""
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        """Set password."""
        self.set_password(password)

    def set_password(self, password):
        """Set password hash."""
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        """Check if password matches."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def get_reset_password_token(self, expires_in=3600):
        """Generate password reset token."""
        return jwt.encode(
            {'reset_password': self.id, 'exp': datetime.utcnow() + timedelta(seconds=expires_in)},
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )

    @staticmethod
    def verify_reset_password_token(token):
        """Verify password reset token."""
        try:
            id = jwt.decode(token, current_app.config['SECRET_KEY'],
                          algorithms=['HS256'])['reset_password']
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

    def __repr__(self):
        """String representation of user."""
        return f'<User {self.username}>'

    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
