from typing import Dict, Optional
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from datetime import datetime
import uuid

from app.db.base_model import Base

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.universe import Universe

class MusicParameter(Base):
    __tablename__ = "music_parameters"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)  # Using String to accommodate various musical values
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Optional for music parameters
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # For additional musical properties
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    universe: Mapped["Universe"] = relationship("Universe", back_populates="music_parameters_rel")

    def __repr__(self) -> str:
        return f"<MusicParameter {self.name}: {self.value}>"
