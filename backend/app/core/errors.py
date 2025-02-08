"""
Custom error handling module for Flask application.
"""

from typing import Any, Dict, Optional
from werkzeug.exceptions import HTTPException as WerkzeugHTTPException
from flask import jsonify

class BaseAppError(Exception):
    """Base error class for application errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(BaseAppError):
    """Raised when data validation fails."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=422, details=details)

class NotFoundError(BaseAppError):
    """Raised when a resource is not found."""
    def __init__(self, resource: str, resource_id: Any):
        super().__init__(
            message=f"{resource} with id {resource_id} not found",
            status_code=404
        )

class AuthenticationError(BaseAppError):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)

class AuthorizationError(BaseAppError):
    """Raised when user doesn't have required permissions."""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status_code=403)

class DatabaseError(BaseAppError):
    """Raised when database operations fail."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class FileOperationError(BaseAppError):
    """Raised when file operations fail."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

def register_error_handlers(app):
    """Register error handlers for the Flask app."""

    @app.errorhandler(BaseAppError)
    def handle_base_error(error):
        response = jsonify({
            'error': {
                'message': error.message,
                'type': error.__class__.__name__,
                'details': error.details
            }
        })
        response.status_code = error.status_code
        return response

    @app.errorhandler(WerkzeugHTTPException)
    def handle_http_error(error):
        response = jsonify({
            'error': {
                'message': error.description,
                'type': error.__class__.__name__,
                'code': error.code
            }
        })
        response.status_code = error.code
        return response

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        app.logger.error(f"Unhandled exception: {str(error)}")
        response = jsonify({
            'error': {
                'message': 'An unexpected error occurred',
                'type': 'InternalServerError',
                'code': 500
            }
        })
        response.status_code = 500
        return response

    # Register specific error handlers
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return handle_base_error(error)

    @app.errorhandler(NotFoundError)
    def handle_not_found_error(error):
        return handle_base_error(error)

    @app.errorhandler(AuthenticationError)
    def handle_authentication_error(error):
        return handle_base_error(error)

    @app.errorhandler(AuthorizationError)
    def handle_authorization_error(error):
        return handle_base_error(error)

    @app.errorhandler(DatabaseError)
    def handle_database_error(error):
        return handle_base_error(error)

    @app.errorhandler(FileOperationError)
    def handle_file_operation_error(error):
        return handle_base_error(error)
