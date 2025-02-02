"""
Export model.
"""

from typing import Dict, Optional
from uuid import UUID
from sqlalchemy import String, Float, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import JSONB
from app.db.custom_types import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum

from app.db.base_class import Base

# Handle circular imports
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.scene import Scene

class ExportStatus(str, enum.Enum):
    """Export status enum."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ExportFormat(str, enum.Enum):
    """Export format enum."""
    MP4 = "mp4"
    MOV = "mov"
    AVI = "avi"
    GIF = "gif"
    PNG_SEQUENCE = "png_sequence"
    JPEG_SEQUENCE = "jpeg_sequence"

class Export(Base):
    """Export model."""
    __tablename__ = "export"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True)
    scene_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("scene.id", ondelete="CASCADE"), nullable=False)
    format: Mapped[ExportFormat] = mapped_column(Enum(ExportFormat), nullable=False)
    status: Mapped[ExportStatus] = mapped_column(Enum(ExportStatus), default=ExportStatus.PENDING)
    settings: Mapped[dict] = mapped_column(
        JSONB().with_variant(JSON(), 'sqlite'),
        server_default='{}'
    )  # Export settings (quality, fps, etc.)
    output_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Path to exported file
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Error message if failed
    progress: Mapped[float] = mapped_column(Float, default=0.0)  # Export progress (0-100)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    scene: Mapped["Scene"] = relationship("Scene", back_populates="exports")

    def __repr__(self) -> str:
        return f"<Export {self.id} ({self.status})>"
