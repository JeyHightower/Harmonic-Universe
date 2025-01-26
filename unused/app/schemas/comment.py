"""Schema for Comment model."""
from marshmallow import Schema, fields


class CommentSchema(Schema):
    """Schema for serializing and deserializing comments."""

    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(required=True)
    universe_id = fields.Integer(required=True)
    content = fields.String(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Nested relationships
    user = fields.Nested("UserSchema", only=("id", "username"), dump_only=True)
    universe = fields.Nested("UniverseSchema", only=("id", "title"), dump_only=True)

    class Meta:
        """Meta class for CommentSchema."""

        ordered = True
