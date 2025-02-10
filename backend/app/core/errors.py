"""Error handling utilities."""

from typing import Optional, Dict, Any
from datetime import datetime

class AppError(Exception):
    """Base application error."""
    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        self.timestamp = datetime.utcnow()

class ValidationError(AppError):
    """Validation error."""
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=400,
            details=details
        )

class AuthenticationError(AppError):
    """Authentication error."""
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=401,
            details=details
        )

class AuthorizationError(AppError):
    """Authorization error."""
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=403,
            details=details
        )

class NotFoundError(AppError):
    """Not found error."""
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="NOT_FOUND_ERROR",
            status_code=404,
            details=details
        )

class DatabaseError(AppError):
    """Database error."""
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            status_code=500,
            details=details
        )

def register_error_handlers(app):
    """Register error handlers for the application."""
    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = {
            'error': {
                'code': error.code,
                'message': error.message,
                'details': error.details,
                'timestamp': error.timestamp.isoformat()
            }
        }
        return response, error.status_code

    @app.errorhandler(404)
    def handle_404(error):
        return {
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Resource not found',
                'timestamp': datetime.utcnow().isoformat()
            }
        }, 404

    @app.errorhandler(500)
    def handle_500(error):
        return {
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'Internal server error',
                'timestamp': datetime.utcnow().isoformat()
            }
        }, 500

__all__ = [
    'AppError',
    'ValidationError',
    'AuthenticationError',
    'AuthorizationError',
    'NotFoundError',
    'DatabaseError',
    'register_error_handlers'
]
