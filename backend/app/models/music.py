"""Music parameter model."""

from datetime import datetime
from uuid import UUID
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
from app.db.custom_types import GUID

class MusicParameter(Base):
    """Music parameter model."""
    __tablename__ = "music_parameters"

    id: Mapped[UUID] = mapped_column(GUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)

    # Foreign keys
    universe_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("universes.id"),
        nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    universe: Mapped["Universe"] = relationship("Universe", back_populates="music_parameters_rel")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<MusicParameter {self.name}={self.value}>"
