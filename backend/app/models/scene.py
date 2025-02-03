"""
Scene model.
"""

from typing import List, Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import String, Column, ForeignKey, Enum as SQLAlchemyEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base_model import Base, GUID

if TYPE_CHECKING:
    from app.models.visualization import Visualization
    from app.models.export import Export
    from app.models.physics_constraint import PhysicsConstraint
    from app.models.physics_object import PhysicsObject
    from app.models.scene_object import SceneObject
    from app.models.timeline import Timeline
    from app.models.user import User
    from app.models.universe import Universe

class RenderingMode(str, enum.Enum):
    """Rendering mode enum."""
    WIREFRAME = "wireframe"
    SOLID = "solid"
    TEXTURED = "textured"
    REALISTIC = "realistic"
    WEBGL = "webgl"

    def __str__(self) -> str:
        return self.value

class Scene(Base):
    """Scene model."""
    __tablename__ = "scenes"
    __table_args__ = {'extend_existing': True}

    # Override id from Base to use GUID type
    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    creator_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)
    universe_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("universes.id"), nullable=False)
    rendering_mode: Mapped[RenderingMode] = mapped_column(
        SQLAlchemyEnum(RenderingMode, name="rendering_mode_enum", create_constraint=True),
        nullable=False,
        default=RenderingMode.SOLID
    )

    # Relationships
    creator = relationship("User", back_populates="scenes")
    universe = relationship("Universe", back_populates="scenes")
    visualizations = relationship("Visualization", back_populates="scene", cascade="all, delete-orphan")
    exports = relationship("Export", back_populates="scene", cascade="all, delete-orphan")
    physics_constraints = relationship("PhysicsConstraint", back_populates="scene", cascade="all, delete-orphan")
    physics_objects = relationship("PhysicsObject", back_populates="scene", cascade="all, delete-orphan")
    scene_objects = relationship("SceneObject", back_populates="scene", cascade="all, delete-orphan", overlaps="objects")
    objects = relationship("SceneObject", back_populates="scene", overlaps="scene_objects", viewonly=True)
    timeline = relationship("Timeline", back_populates="scene", uselist=False, cascade="all, delete-orphan", overlaps="timelines")
    timelines = relationship("Timeline", back_populates="scene", overlaps="timeline", viewonly=True)

    # Scene settings
    settings: Mapped[dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    # Scene data
    data: Mapped[dict] = mapped_column(
        JSON,
        server_default='{}',
        nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Scene {self.name}>"
