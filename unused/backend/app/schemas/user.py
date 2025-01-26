"""User schema for serialization and deserialization."""
from marshmallow import Schema, fields, validate, validates, ValidationError
import re
from app.models import User


class UserSchema(Schema):
    """Schema for serializing/deserializing user data."""

    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=30))
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8))
    is_active = fields.Bool(dump_only=True)
    last_login = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Add any nested relationships if needed
    profile = fields.Nested("ProfileSchema", exclude=("user",))
    universes = fields.Nested("UniverseSchema", many=True, exclude=("user",))
    universe_collaborations = fields.Nested(
        "UniverseCollaboratorSchema", many=True, exclude=("user",)
    )
    comments = fields.Nested("CommentSchema", many=True, exclude=("user",))
    favorites = fields.Nested("FavoriteSchema", many=True, exclude=("user",))
    versions = fields.Nested("VersionSchema", many=True, exclude=("user",))
    templates = fields.Nested("TemplateSchema", many=True, exclude=("user",))

    # Counts
    universes_count = fields.Int(dump_only=True)
    collaborations_count = fields.Int(dump_only=True)
    comments_count = fields.Int(dump_only=True)
    favorites_count = fields.Int(dump_only=True)

    @validates('username')
    def validate_username(self, value):
        if not value.replace('_', '').replace('-', '').isalnum():
            raise ValidationError('Username can only contain letters, numbers, underscores, and hyphens')

    @validates('password')
    def validate_password(self, value):
        if not any(c.isupper() for c in value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in value):
            raise ValidationError('Password must contain at least one number')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in value):
            raise ValidationError('Password must contain at least one special character')

    class Meta:
        """Meta class for UserSchema."""

        ordered = True
