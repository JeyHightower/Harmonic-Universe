from marshmallow import Schema, fields, validate

class UniverseSchema(Schema):
    """Schema for serializing/deserializing Universe objects."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(validate=validate.Length(max=1000))
    creator_id = fields.Int(dump_only=True)
    is_public = fields.Bool(missing=False)
    allow_guests = fields.Bool(missing=False)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Nested relationships
    creator = fields.Nested('UserSchema', only=('id', 'username', 'email'), dump_only=True)
    parameters_count = fields.Int(dump_only=True)
    collaborators_count = fields.Int(dump_only=True)
    comments_count = fields.Int(dump_only=True)
    favorites_count = fields.Int(dump_only=True)

    class Meta:
        """Meta class for UniverseSchema."""
        ordered = True
