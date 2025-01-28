from . import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
from flask import current_app
import json
from sqlalchemy import event

class User(UserMixin, db.Model):
    """User model for storing user account information."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)

    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False)
    universes = db.relationship('Universe', backref='creator', lazy='dynamic')
    owned_universes = db.relationship('Universe', backref=db.backref('owner', passive_deletes=True),
                                    lazy='dynamic',
                                    foreign_keys='Universe.creator_id',
                                    passive_deletes=True)
    collaborating_universes = db.relationship('Universe',
                                            secondary='universe_collaborators',
                                            lazy='dynamic',
                                            back_populates='collaborators')
    accessible_universes = db.relationship('Universe',
                                         secondary='universe_access',
                                         primaryjoin='and_(User.id == universe_access.c.user_id)',
                                         secondaryjoin='Universe.id == universe_access.c.universe_id',
                                         backref=db.backref('accessible_by', lazy='dynamic'),
                                         lazy='dynamic')

    def __init__(self, username, email):
        self.username = username
        self.email = email

    def set_password(self, password):
        """Set the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if the provided password matches the user's password."""
        return check_password_hash(self.password_hash, password)

    def update_last_login(self):
        self.last_login = datetime.utcnow()
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
        self.updated_at = datetime.utcnow()
        db.session.commit()

    def get_id(self):
        """Return the user ID as a string (required for Flask-Login)"""
        return str(self.id)

    def __str__(self):
        return f'<User {self.username}>'

    def __repr__(self):
        return self.__str__()

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
        """Convert user object to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
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
                universe.creator_id == self.id or
                universe in self.accessible_universes)

    def can_modify(self, universe):
        """Check if user can modify universe."""
        return universe.creator_id == self.id

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
    # Update creator_id to None for all universes created by this user
    connection.execute(
        db.text('UPDATE universes SET creator_id = NULL WHERE creator_id = :user_id'),
        {'user_id': target.id}
    )
