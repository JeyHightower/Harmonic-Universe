from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

class Universe(Base):
    __tablename__ = "universes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    description = Column(String)
    is_public = Column(Boolean, default=False)
    user_id = Column(String, ForeignKey("users.id"))
    physics_params = Column(JSON)
    harmony_params = Column(JSON)
    story_points = Column(JSON)
    visualization_params = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="universes")
    scenes = relationship("Scene", back_populates="universe", cascade="all, delete-orphan")
