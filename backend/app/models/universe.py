from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .. import db


class Universe(db.Model):
    __tablename__ = "universe"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    max_participants = db.Column(db.Integer, default=10)
    parameters = db.Column(JSONB, default={})
    is_public = db.Column(db.Boolean, default=False)
    allow_guests = db.Column(db.Boolean, default=False)
    physics_enabled = db.Column(db.Boolean, default=True)
    music_enabled = db.Column(db.Boolean, default=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = db.relationship("User", backref=db.backref("universes", lazy=True))

    def __init__(self, name, owner_id, description=None, max_participants=10, parameters=None, is_public=False):
        self.name = name
        self.owner_id = owner_id
        self.description = description
        self.max_participants = max_participants
        self.parameters = parameters or {
            'physics': {},
            'music': {},
            'visual': {}
        }
        self.is_public = is_public

    def can_access(self, user):
        """Check if a user can access this universe"""
        return (self.is_public or
                user.id == self.owner_id or
                user in self.collaborators)

    def can_modify(self, user):
        """Check if a user can modify this universe"""
        return user.id == self.owner_id or user in self.collaborators

    def __repr__(self):
        return f"<Universe {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "max_participants": self.max_participants,
            "parameters": self.parameters,
            "is_public": self.is_public,
            "allow_guests": self.allow_guests,
            "physics_enabled": self.physics_enabled,
            "music_enabled": self.music_enabled,
            "owner_id": self.owner_id,
            "owner": self.owner.username,
            "collaborators": [user.to_dict() for user in self.collaborators],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
