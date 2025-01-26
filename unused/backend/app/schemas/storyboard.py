"""Storyboard schema for serialization and deserialization."""
from marshmallow import Schema, fields, validates, ValidationError


class StoryboardSchema(Schema):
    """Schema for serializing/deserializing storyboard data."""
    id = fields.Int(dump_only=True)
    universe_id = fields.Int(required=True)
    title = fields.Str(required=True)
    description = fields.Str()
    harmony_value = fields.Float()
    sequence_number = fields.Int()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Relationships
    universe = fields.Nested("UniverseSchema", only=("id", "name"), dump_only=True)

    @validates('harmony_value')
    def validate_harmony_value(self, value):
        if value is not None:
            if not isinstance(value, (int, float)):
                raise ValidationError('Harmony value must be a number')
            if not 0 <= value <= 1:
                raise ValidationError('Harmony value must be between 0 and 1')

    @validates('sequence_number')
    def validate_sequence_number(self, value):
        if value is not None and value < 0:
            raise ValidationError('Sequence number must be non-negative')

    class Meta:
        """Meta class for StoryboardSchema."""
        ordered = True
