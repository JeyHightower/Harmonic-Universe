from app import db, bcrypt
from .base import BaseModel
from sqlalchemy.ext.hybrid import hybrid_property

class User(BaseModel):
    __tablename__ = 'users'

    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    _password = db.Column('password', db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)

    # Relationships
    projects = db.relationship('Project', back_populates='user', lazy='dynamic')
    audio_files = db.relationship('AudioFile', back_populates='user', lazy='dynamic')
    visualizations = db.relationship('Visualization', back_populates='user', lazy='dynamic')

    @hybrid_property
    def password(self):
        return self._password

    @password.setter
    def password(self, value):
        self._password = bcrypt.generate_password_hash(value).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self._password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<User {self.username}>'
