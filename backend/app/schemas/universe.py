from marshmallow import Schema, fields, validates, ValidationError


class PhysicsParamsSchema(Schema):
    """Schema for physics parameters."""
    gravity = fields.Float(required=True)
    friction = fields.Float(required=True)
    elasticity = fields.Float(required=True)
    air_resistance = fields.Float(required=True)

    @validates('gravity')
    def validate_gravity(self, value):
        if value <= 0:
            raise ValidationError('Gravity must be positive')

    @validates('friction')
    def validate_friction(self, value):
        if not 0 <= value <= 1:
            raise ValidationError('Friction must be between 0 and 1')

    @validates('elasticity')
    def validate_elasticity(self, value):
        if not 0 <= value <= 1:
            raise ValidationError('Elasticity must be between 0 and 1')

    @validates('air_resistance')
    def validate_air_resistance(self, value):
        if not 0 <= value <= 1:
            raise ValidationError('Air resistance must be between 0 and 1')


class MusicParamsSchema(Schema):
    """Schema for music parameters."""
    harmony = fields.String(required=True)
    tempo = fields.Float(required=True)
    key = fields.String(required=True)
    scale = fields.String(required=True)

    @validates('tempo')
    def validate_tempo(self, value):
        if not 20 <= value <= 300:
            raise ValidationError('Tempo must be between 20 and 300 BPM')


class VisualParamsSchema(Schema):
    """Schema for visualization parameters."""
    color_scheme = fields.String(required=True)
    particle_size = fields.Float(required=True)
    trail_length = fields.Float(required=True)

    @validates('particle_size')
    def validate_particle_size(self, value):
        if value <= 0:
            raise ValidationError('Particle size must be positive')

    @validates('trail_length')
    def validate_trail_length(self, value):
        if value <= 0:
            raise ValidationError('Trail length must be positive')


class UniverseSchema(Schema):
    """Schema for serializing/deserializing universe data."""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    is_public = fields.Bool()
    user_id = fields.Int(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Parameters
    physics_params = fields.Nested(PhysicsParamsSchema)
    music_params = fields.Nested(MusicParamsSchema)
    visual_params = fields.Nested(VisualParamsSchema)

    # Relationships
    user = fields.Nested("UserSchema", only=("id", "username"), dump_only=True)
    storyboards = fields.Nested("StoryboardSchema", many=True, dump_only=True)

    class Meta:
        """Meta class for UniverseSchema."""
        ordered = True
