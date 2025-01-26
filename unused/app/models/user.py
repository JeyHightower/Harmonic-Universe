"""User model."""
from app.extensions import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from flask import current_app


class User(db.Model):
    """User model for storing user related details."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    universes = db.relationship("Universe", back_populates="user", lazy=True)
    collaborations = db.relationship(
        "UniverseCollaborator", back_populates="user", lazy=True
    )
    comments = db.relationship("Comment", back_populates="user", lazy=True)
    favorites = db.relationship("Favorite", back_populates="user", lazy=True)
    profile = db.relationship(
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def __init__(self, username, email, password=None):
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

    def set_password(self, password):
        """Set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
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

    def to_dict(self):
        """Convert user object to dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "universes_count": len(self.universes),
            "collaborations_count": len(self.collaborations),
            "comments_count": len(self.comments),
            "favorites_count": len(self.favorites),
        }

    def __repr__(self):
        return f"<User {self.username}>"
