"""
Audio control models for markers and automation.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from ..base import BaseModel

class AutomationType(str, enum.Enum):
    """Types of automation parameters."""
    VOLUME = "volume"
    PAN = "pan"
    EFFECT_PARAM = "effect_param"
    CUSTOM = "custom"

class AudioMarker(BaseModel):
    """Marker in an audio track."""
    __tablename__ = "audio_markers"

    track_id = Column(UUID(as_uuid=True), ForeignKey("audio_tracks.id", ondelete="CASCADE"))
    name = Column(String, index=True)
    time = Column(Float)
    color = Column(String, nullable=True)
    description = Column(String, nullable=True)
    parameters = Column(JSON, default=dict)

    # Relationships
    track = relationship("AudioTrack", back_populates="markers")

    def __repr__(self):
        """String representation."""
        return f"<AudioMarker(id={self.id}, name='{self.name}', time={self.time})>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "track_id": self.track_id,
            "name": self.name,
            "time": self.time,
            "color": self.color,
            "description": self.description,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class AudioAutomation(BaseModel):
    """Automation data for audio parameters."""
    __tablename__ = "audio_automation"

    track_id = Column(UUID(as_uuid=True), ForeignKey("audio_tracks.id", ondelete="CASCADE"))
    parameter_type = Column(Enum(AutomationType))
    target_id = Column(String, nullable=True)  # For effect parameters
    points = Column(JSON, default=list)  # List of {time, value} points
    curve_type = Column(String, default="linear")  # linear, exponential, etc.
    enabled = Column(Boolean, default=True)
    parameters = Column(JSON, default=dict)

    # Relationships
    track = relationship("AudioTrack", back_populates="automation")

    def __repr__(self):
        """String representation."""
        return f"<AudioAutomation(id={self.id}, type='{self.parameter_type}')>"

    def get_value_at_time(self, time: float) -> float:
        """Calculate interpolated value at given time."""
        if not self.points:
            return 0.0

        # Sort points by time
        sorted_points = sorted(self.points, key=lambda p: p["time"])

        # Before first point
        if time <= sorted_points[0]["time"]:
            return sorted_points[0]["value"]

        # After last point
        if time >= sorted_points[-1]["time"]:
            return sorted_points[-1]["value"]

        # Find surrounding points
        for i in range(len(sorted_points) - 1):
            p1 = sorted_points[i]
            p2 = sorted_points[i + 1]

            if p1["time"] <= time <= p2["time"]:
                # Linear interpolation
                if self.curve_type == "linear":
                    t = (time - p1["time"]) / (p2["time"] - p1["time"])
                    return p1["value"] + t * (p2["value"] - p1["value"])

                # Exponential interpolation
                elif self.curve_type == "exponential":
                    t = (time - p1["time"]) / (p2["time"] - p1["time"])
                    return p1["value"] * (p2["value"] / p1["value"]) ** t

                # Default to linear
                else:
                    t = (time - p1["time"]) / (p2["time"] - p1["time"])
                    return p1["value"] + t * (p2["value"] - p1["value"])

        return sorted_points[-1]["value"]

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "track_id": self.track_id,
            "parameter_type": self.parameter_type.value,
            "target_id": self.target_id,
            "points": self.points,
            "curve_type": self.curve_type,
            "enabled": self.enabled,
            "parameters": self.parameters,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
