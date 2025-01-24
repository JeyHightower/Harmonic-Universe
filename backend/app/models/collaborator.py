from app import db
from datetime import datetime

class Collaborator(db.Model):
    """Model for universe collaborators."""
    __tablename__ = 'collaborators'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='viewer')  # viewer, editor, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    universe = db.relationship('Universe', backref=db.backref('collaborators', lazy=True, cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('collaborations', lazy=True))

    def __init__(self, universe_id, user_id, role='viewer'):
        self.universe_id = universe_id
        self.user_id = user_id
        self.role = role

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'user_id': self.user_id,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user': self.user.to_dict() if self.user else None
        }

    @staticmethod
    def get_user_collaborations(user_id):
        return Collaborator.query.filter_by(user_id=user_id).all()

    @staticmethod
    def get_universe_collaborators(universe_id):
        return Collaborator.query.filter_by(universe_id=universe_id).all()
