"""Scene model."""

from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User  # noqa: F401
    from .universe import Universe  # noqa: F401
    from ..physics.physics_parameter import PhysicsParameter  # noqa: F401
    from ..audio.audio_file import AudioFile  # noqa: F401
    from ..organization.timeline import Timeline  # noqa: F401

class Scene(Base):
    """Scene model."""

    __tablename__ = "scenes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)

    # Foreign Keys
    universe_id = Column(Integer, ForeignKey("universes.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    universe = relationship("Universe", back_populates="scenes")
    creator = relationship("User", back_populates="scenes")
    physics_parameters = relationship("PhysicsParameter", back_populates="scene", uselist=False)
    audio_files = relationship("AudioFile", back_populates="scene")
    timelines = relationship("Timeline", back_populates="scene")

    def __repr__(self) -> str:
        """String representation of Scene."""
        return f"<Scene {self.name}>"
