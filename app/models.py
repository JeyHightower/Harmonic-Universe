import uuid
from app import db
from datetime import datetime
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String, unique=True, index=True, nullable=False)
    email = db.Column(db.String, unique=True, index=True, nullable=False)
    hashed_password = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        """Set user's password"""
        self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches the hash"""
        return check_password_hash(self.hashed_password, password)

    def to_dict(self):
        """Return a dict representation of the user"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<User {self.username}>"

class Universe(db.Model):
    __tablename__ = "universes"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String, index=True, nullable=False)
    description = db.Column(db.String)
    is_public = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.String, db.ForeignKey("users.id"), nullable=False)
    physics_params = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Universe {self.name}>"
