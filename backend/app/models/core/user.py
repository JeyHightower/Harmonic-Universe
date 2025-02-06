"""User model."""

from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from ..physics import PhysicsModel  # noqa: F401
    from .scene import Scene  # noqa: F401

class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Relationships
    physics_models = relationship(
        "PhysicsModel",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    scenes = relationship(
        "Scene",
        back_populates="creator",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation of User."""
        return f"<User {self.email}>"
