from ..extensions import db

class VisualizationParameters(db.Model):
    __tablename__ = 'visualization_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)

    # Color parameters
    background_color = db.Column(db.String(7), default='#000000')  # Hex color
    particle_color = db.Column(db.String(7), default='#FFFFFF')    # Hex color
    glow_color = db.Column(db.String(7), default='#00FF00')       # Hex color

    # Particle system parameters
    particle_count = db.Column(db.Integer, default=1000)
    particle_size = db.Column(db.Float, default=2.0)
    particle_speed = db.Column(db.Float, default=1.0)

    # Visual effects
    glow_intensity = db.Column(db.Float, default=0.5)
    blur_amount = db.Column(db.Float, default=0.0)
    trail_length = db.Column(db.Float, default=0.5)

    # Animation parameters
    animation_speed = db.Column(db.Float, default=1.0)
    bounce_factor = db.Column(db.Float, default=0.8)
    rotation_speed = db.Column(db.Float, default=0.0)

    # Camera parameters
    camera_zoom = db.Column(db.Float, default=1.0)
    camera_rotation = db.Column(db.Float, default=0.0)

    # Relationship
    universe = db.relationship('Universe', back_populates='visualization_parameters')

    def __repr__(self):
        return f'<VisualizationParameters {self.id} for Universe {self.universe_id}>'

    def to_dict(self):
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
            'camera_rotation': self.camera_rotation
        }
