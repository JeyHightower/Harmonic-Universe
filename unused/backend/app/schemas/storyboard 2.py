"""Storyboard schema module."""
from marshmallow import Schema, fields


class StoryboardSchema(Schema):
    """Schema for Storyboard model."""

    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str()
    content = fields.Dict(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    universe_id = fields.Int(required=True)
    user_id = fields.Int(required=True)
    version = fields.Int(dump_only=True)

    # Nested relationships
    universe = fields.Nested("UniverseSchema", only=("id", "name"), dump_only=True)
    user = fields.Nested("UserSchema", only=("id", "username"), dump_only=True)
    versions = fields.Nested("VersionSchema", many=True, dump_only=True)
