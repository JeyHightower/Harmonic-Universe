"""Universe model."""
from datetime import datetime, timezone
from ..extensions import db
from sqlalchemy.orm import relationship
from typing import Dict, Any, Optional
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import or_


class Universe(db.Model):
    """Universe model for storing universe related details."""

    __tablename__ = "universes"
    __table_args__ = (
        db.Index("idx_user_id", "user_id"),
        db.Index("idx_is_public", "is_public"),
        db.Index("idx_created_at", "created_at"),
        db.Index("idx_name", "name"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    is_public = Column(Boolean, default=False)
    allow_guests = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="universes")
    physics_parameters = relationship(
        "PhysicsParameters",
        back_populates="universe",
        uselist=False,
        cascade="all, delete-orphan",
    )
    collaborators = relationship(
        "UniverseCollaborator",
        back_populates="universe",
        lazy=True,
        cascade="all, delete-orphan",
    )
    comments = relationship(
        "Comment", back_populates="universe", lazy=True, cascade="all, delete-orphan"
    )
    favorites = relationship(
        "Favorite", back_populates="universe", lazy=True, cascade="all, delete-orphan"
    )

    def __init__(
        self,
        name: str,
        description: str = None,
        is_public: bool = False,
        allow_guests: bool = False,
        user_id: int = None,
    ):
        self.name = name
        self.description = description
        self.is_public = is_public
        self.allow_guests = allow_guests
        self.user_id = user_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert universe to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_public": self.is_public,
            "allow_guests": self.allow_guests,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "physics_parameters": self.physics_parameters.to_dict()
            if self.physics_parameters
            else None,
            "collaborators_count": len(self.collaborators),
            "comments_count": len(self.comments),
            "favorites_count": len(self.favorites),
        }

    def update_dependent_parameters(self, source: str):
        if source == "physics":
            if self.physics_parameters:
                gravity = self.physics_parameters.gravity

        elif source == "audio":
            if self.physics_parameters:
                self.physics_parameters.gravity = min(
                    20.0, max(1.0, 9.81 * (self.audio_parameters.volume * 20))
                )

    def get_ai_suggestions(
        self, ai_service, target: str, constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return ai_service.get_parameter_suggestions(self.id, target, constraints)

    def generate_music_notes(self) -> Dict[str, Any]:
        if not self.music_parameters:
            return {"error": "No music parameters set"}

        return {
            "notes": [
                {"pitch": 60, "startTime": 0.0, "duration": 0.5, "velocity": 0.8},
                {"pitch": 64, "startTime": 0.5, "duration": 0.5, "velocity": 0.7},
                {"pitch": 67, "startTime": 1.0, "duration": 1.0, "velocity": 0.9},
            ],
            "tempo": self.music_parameters.tempo,
            "key": self.music_parameters.key,
            "scale": self.music_parameters.scale,
        }

    def __repr__(self):
        return f"<Universe {self.name}>"

    @staticmethod
    def from_dict(data):
        """Create a Universe instance from a dictionary."""
        return Universe(name=data.get("name"), description=data.get("description"))

    @classmethod
    def get_public_universes(cls):
        return cls.query.filter_by(is_public=True).options(
            db.joinedload(cls.physics_parameters)
        )

    @classmethod
    def get_user_universes(cls, user_id):
        return cls.query.filter(
            or_(cls.user_id == user_id, cls.is_public == True)
        ).options(db.joinedload(cls.physics_parameters))
