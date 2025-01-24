class PhysicsParameters(db.Model):
    """Physics parameters for a universe."""

    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    gravity = db.Column(db.Float, nullable=False, default=9.81)
    friction = db.Column(db.Float, nullable=True)
    time_scale = db.Column(db.Float, nullable=True)
    air_resistance = db.Column(db.Float, nullable=True)
    density = db.Column(db.Float, nullable=True)
    particle_speed = db.Column(db.Float, nullable=False, default=1.0)

    # Relationships
    universe = db.relationship('Universe', back_populates='physics_parameters')

    def validate(self):
        """Validate physics parameters."""
        # Set default values for nullable fields
        if self.time_scale is None:
            self.time_scale = 1.0
        if self.air_resistance is None:
            self.air_resistance = 0.1
        if self.density is None:
            self.density = 1.0
        if self.friction is None:
            self.friction = 0.5

        if self.gravity <= 0:
            raise ValueError("Gravity must be positive")
        if not 0 <= self.friction <= 1:
            raise ValueError("Friction must be between 0 and 1")
