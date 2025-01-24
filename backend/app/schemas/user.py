from marshmallow import Schema, fields, validate, validates, ValidationError
import re

class UserSchema(Schema):
    """Schema for serializing/deserializing User objects."""

    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(load_only=True, validate=validate.Length(min=8))
    is_active = fields.Bool(dump_only=True)
    is_admin = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Counts
    universes_count = fields.Int(dump_only=True)
    collaborations_count = fields.Int(dump_only=True)
    comments_count = fields.Int(dump_only=True)
    favorites_count = fields.Int(dump_only=True)

    @validates('username')
    def validate_username(self, value):
        """Validate username format."""
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise ValidationError('Username can only contain letters, numbers, underscores, and hyphens')
        return value

    @validates('password')
    def validate_password(self, value):
        """Validate password strength."""
        if not any(char.isupper() for char in value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not any(char.isdigit() for char in value):
            raise ValidationError('Password must contain at least one number')
        if not any(char in '!@#$%^&*(),.?":{}|<>' for char in value):
            raise ValidationError('Password must contain at least one special character')
        return value

    class Meta:
        """Meta class for UserSchema."""
        ordered = True
