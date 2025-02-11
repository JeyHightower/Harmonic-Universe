"""
Base schemas with common validation patterns.
"""

from datetime import datetime
from typing import Dict, Any
from marshmallow import Schema, fields, validates, ValidationError, pre_load, post_dump

class TimestampedSchema(Schema):
    """Base schema with timestamp fields."""
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @pre_load
    def set_timestamps(self, data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Set timestamps on creation/update."""
        now = datetime.utcnow()
        if not data.get('created_at'):
            data['created_at'] = now
        data['updated_at'] = now
        return data

class IDSchema(Schema):
    """Base schema with ID field."""
    id = fields.Integer(required=True, validate=lambda x: x > 0)

class NameDescriptionSchema(Schema):
    """Base schema with name and description fields."""
    name = fields.String(required=True, validate=lambda x: 0 < len(x) <= 255)
    description = fields.String(validate=lambda x: len(x) <= 1000, allow_none=True)

class MetadataSchema(Schema):
    """Base schema with metadata field."""
    metadata = fields.Dict(keys=fields.String(), values=fields.Raw(), missing=dict)

class BaseAppSchema(TimestampedSchema, IDSchema):
    """Base schema for all application schemas."""

    @post_dump
    def format_dates(self, data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Format datetime fields as ISO strings."""
        if 'created_at' in data:
            data['created_at'] = data['created_at'].isoformat()
        if 'updated_at' in data:
            data['updated_at'] = data['updated_at'].isoformat()
        return data

class BaseResponseSchema(Schema):
    """Base schema for all response schemas."""
    success = fields.Boolean(dump_only=True, default=True)
    message = fields.String(allow_none=True)
    data = fields.Dict(allow_none=True)

class PaginationSchema(Schema):
    """Common pagination parameters."""
    page = fields.Integer(validate=lambda x: x > 0, missing=1)
    per_page = fields.Integer(validate=lambda x: 0 < x <= 100, missing=10)
    sort_by = fields.String(allow_none=True)
    sort_order = fields.String(validate=lambda x: x in ['asc', 'desc'], allow_none=True)

    @validates('sort_order')
    def validate_sort_order(self, value):
        """Validate sort order value."""
        if value and value not in ['asc', 'desc']:
            raise ValidationError('Sort order must be either "asc" or "desc"')

class ErrorResponseSchema(Schema):
    """Standard error response schema."""
    success = fields.Boolean(dump_only=True, default=False)
    error = fields.Dict()
    message = fields.String(required=True)

    @post_dump
    def format_dates(self, data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Format any datetime fields in error details as ISO strings."""
        if 'error' in data and isinstance(data['error'], dict):
            for key, value in data['error'].items():
                if isinstance(value, datetime):
                    data['error'][key] = value.isoformat()
        return data
