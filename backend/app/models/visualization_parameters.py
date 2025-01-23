from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, ForeignKey, event, DateTime
from sqlalchemy.orm import relationship
import re
from app.extensions import db

class VisualizationParameters(db.Model):
    __tablename__ = 'visualization_parameters'

    id = Column(Integer, primary_key=True)
    universe_id = Column(Integer, ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)

    # Color parameters
    background_color = Column(String(7), default='#000000')  # Hex color
    particle_color = Column(String(7), default='#FFFFFF')    # Hex color
    glow_color = Column(String(7), default='#FFFFFF')       # Hex color

    # Particle system parameters
    particle_count = Column(Integer, default=1000)
    particle_size = Column(Float, default=2.0)
    particle_speed = Column(Float, default=1.0)

    # Visual effects
    glow_intensity = Column(Float, default=0.5)
    blur_amount = Column(Float, default=0.0)
    trail_length = Column(Float, default=0.0)

    # Animation parameters
    animation_speed = Column(Float, default=1.0)
    bounce_factor = Column(Float, default=0.5)
    rotation_speed = Column(Float, default=0.0)

    # Camera parameters
    camera_zoom = Column(Float, default=1.0)
    camera_rotation = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    universe = relationship('Universe', back_populates='visualization_parameters')

    def validate(self):
        """Validate visualization parameters."""
        # Set default values for nullable fields
        if self.particle_count is None:
            self.particle_count = 1000
        if self.particle_size is None:
            self.particle_size = 2.0
        if self.particle_speed is None:
            self.particle_speed = 1.0
        if self.glow_intensity is None:
            self.glow_intensity = 0.5
        if self.blur_amount is None:
            self.blur_amount = 0.0
        if self.trail_length is None:
            self.trail_length = 0.0
        if self.animation_speed is None:
            self.animation_speed = 1.0
        if self.bounce_factor is None:
            self.bounce_factor = 0.5
        if self.rotation_speed is None:
            self.rotation_speed = 0.0
        if self.camera_zoom is None:
            self.camera_zoom = 1.0
        if self.camera_rotation is None:
            self.camera_rotation = 0.0
        if self.background_color is None:
            self.background_color = '#000000'
        if self.particle_color is None:
            self.particle_color = '#FFFFFF'
        if self.glow_color is None:
            self.glow_color = '#FFFFFF'

        # Validate color formats (hex colors)
        hex_pattern = re.compile(r'^#[0-9A-Fa-f]{6}$')
        for color, name in [(self.background_color, 'Background color'),
                          (self.particle_color, 'Particle color'),
                          (self.glow_color, 'Glow color')]:
            if not hex_pattern.match(color):
                raise ValueError(f"{name} must be a valid hex color (e.g., #FF0000)")

        # Validate particle system parameters
        if not 1 <= self.particle_count <= 10000:
            raise ValueError("Particle count must be between 1 and 10000")
        if not 0.1 <= self.particle_size <= 10.0:
            raise ValueError("Particle size must be between 0.1 and 10.0")
        if not 0.0 <= self.particle_speed <= 5.0:
            raise ValueError("Particle speed must be between 0.0 and 5.0")

        # Validate visual effects
        if not 0.0 <= self.glow_intensity <= 1.0:
            raise ValueError("Glow intensity must be between 0.0 and 1.0")
        if not 0.0 <= self.blur_amount <= 1.0:
            raise ValueError("Blur amount must be between 0.0 and 1.0")
        if not 0.0 <= self.trail_length <= 5.0:
            raise ValueError("Trail length must be between 0.0 and 5.0")

        # Validate animation parameters
        if not 0.0 <= self.animation_speed <= 5.0:
            raise ValueError("Animation speed must be between 0.0 and 5.0")
        if not 0.0 <= self.bounce_factor <= 1.0:
            raise ValueError("Bounce factor must be between 0.0 and 1.0")
        if not -5.0 <= self.rotation_speed <= 5.0:
            raise ValueError("Rotation speed must be between -5.0 and 5.0")

        # Validate camera parameters
        if not 0.1 <= self.camera_zoom <= 10.0:
            raise ValueError("Camera zoom must be between 0.1 and 10.0")
        if not -360.0 <= self.camera_rotation <= 360.0:
            raise ValueError("Camera rotation must be between -360.0 and 360.0")

    def __repr__(self):
        return f'<VisualizationParameters {self.id} for Universe {self.universe_id}>'

    def to_dict(self):
        """Convert the parameters to a dictionary."""
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'background_color': self.background_color,
            'particle_color': self.particle_color,
            'glow_color': self.glow_color,
            'particle_count': self.particle_count,
            'particle_size': self.particle_size,
            'particle_speed': self.particle_speed,
            'glow_intensity': self.glow_intensity,
            'blur_amount': self.blur_amount,
            'trail_length': self.trail_length,
            'animation_speed': self.animation_speed,
            'bounce_factor': self.bounce_factor,
            'rotation_speed': self.rotation_speed,
            'camera_zoom': self.camera_zoom,
            'camera_rotation': self.camera_rotation,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def update(self, data):
        """Update the parameters with new values."""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.validate()

@event.listens_for(VisualizationParameters, 'before_insert')
@event.listens_for(VisualizationParameters, 'before_update')
def validate_visualization_parameters(mapper, connection, target):
    """Validate visualization parameters before insert or update."""
    target.validate()
