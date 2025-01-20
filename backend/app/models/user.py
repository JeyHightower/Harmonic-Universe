from app.extensions import db
from datetime import datetime
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships using string references
    universes = db.relationship('Universe',
                              foreign_keys='Universe.user_id',
                              back_populates='user',
                              cascade='all, delete-orphan')
    favorites = db.relationship('Favorite',
                              foreign_keys='Favorite.user_id',
                              back_populates='user',
                              cascade='all, delete-orphan')
    favorite_universes = db.relationship('Universe',
                                       secondary='favorites',
                                       primaryjoin='User.id == Favorite.user_id',
                                       secondaryjoin='Favorite.universe_id == Universe.id',
                                       back_populates='favorited_by',
                                       overlaps="favorites,users_favorited")
    comments = db.relationship('Comment',
                             foreign_keys='Comment.user_id',
                             back_populates='user',
                             cascade='all, delete-orphan')
    # Use deferred loading for versions relationship
    versions = relationship('Version',
                         primaryjoin='User.id == foreign(Version.created_by)',
                         back_populates='creator',
                         lazy='dynamic')
    templates = db.relationship('Template',
                              foreign_keys='Template.creator_id',
                              back_populates='creator',
                              cascade='all, delete-orphan')
    storyboards = db.relationship('Storyboard',
                                foreign_keys='Storyboard.user_id',
                                back_populates='user',
                                cascade='all, delete-orphan')

    def __init__(self, email, password):
        self.email = email
        self.set_password(password)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
