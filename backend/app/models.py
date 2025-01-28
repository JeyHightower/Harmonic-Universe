from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from .extensions import db

class User(db.Model):
    """User model."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        """Set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
