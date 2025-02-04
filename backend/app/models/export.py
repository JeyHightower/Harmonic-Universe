"""
Export model.
"""

from typing import Dict, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey, Enum as SQLAlchemyEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_model import Base, GUID

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.scene import Scene

class ExportFormat(str, enum.Enum):
    """Export format enum."""
    MP4 = "MP4"
    MOV = "MOV"
    AVI = "AVI"
    GIF = "GIF"
    PNG_SEQUENCE = "PNG_SEQUENCE"
    JPEG_SEQUENCE = "JPEG_SEQUENCE"

class ExportStatus(str, enum.Enum):
    """Export status enum."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Export(Base):
    """Export model."""
    __tablename__ = "exports"
    __table_args__ = {'extend_existing': True}

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    format: Mapped[ExportFormat] = mapped_column(SQLAlchemyEnum(ExportFormat), nullable=False)
    status: Mapped[ExportStatus] = mapped_column(SQLAlchemyEnum(ExportStatus), nullable=False)

    # Export settings stored as JSON
    settings: Mapped[Dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    output_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    progress: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="exports")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Export {self.id} ({self.format})>"
