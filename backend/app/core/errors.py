"""
Custom error handling module.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from flask import jsonify
from werkzeug.exceptions import HTTPException as WerkzeugHTTPException

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
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)

class NotFoundError(BaseAppError):
    """Raised when a resource is not found."""
    def __init__(self, resource: str, resource_id: Any):
        super().__init__(
            message=f"{resource} with id {resource_id} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

class AuthenticationError(BaseAppError):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)

class AuthorizationError(BaseAppError):
    """Raised when user doesn't have required permissions."""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)

class DatabaseError(BaseAppError):
    """Raised when database operations fail."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

class FileOperationError(BaseAppError):
    """Raised when file operations fail."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

def handle_app_error(error: BaseAppError) -> Dict[str, Any]:
    """Convert application error to response format."""
    return {
        "error": {
            "message": error.message,
            "type": error.__class__.__name__,
            "details": error.details
        }
    }

def get_http_exception(error: BaseAppError) -> HTTPException:
    """Convert application error to FastAPI HTTPException."""
    return HTTPException(
        status_code=error.status_code,
        detail=handle_app_error(error)
    )

class AppError(Exception):
    """Base application error class."""
    def __init__(self, message, code=500, payload=None):
        super().__init__()
        self.message = message
        self.code = code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['code'] = self.code
        rv['status'] = 'error'
        return rv

def register_error_handlers(app):
    """Register error handlers for the Flask app."""

    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.code
        return response

    @app.errorhandler(WerkzeugHTTPException)
    def handle_http_error(error):
        response = jsonify({
            'status': 'error',
            'message': error.description,
            'code': error.code
        })
        response.status_code = error.code
        return response

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        # Log the error here
        app.logger.error(f"Unhandled exception: {str(error)}")
        response = jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred',
            'code': 500
        })
        response.status_code = 500
        return response

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Resource not found',
            'code': 404
        }), 404

    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Bad request',
            'code': 400
        }), 400

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        return jsonify({
            'status': 'error',
            'message': 'Method not allowed',
            'code': 405
        }), 405

    @app.errorhandler(500)
    def internal_error(error):
        # Log the error here
        app.logger.error(f"Internal server error: {str(error)}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'code': 500
        }), 500
