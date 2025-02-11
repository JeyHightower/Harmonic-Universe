"""
Error handling for the application.
"""

from flask import jsonify
from werkzeug.exceptions import HTTPException

class AppError(Exception):
    """Base application error."""
    def __init__(self, message: str, code: str = None, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code or self.__class__.__name__
        self.status_code = status_code
        self.details = None

    def to_dict(self):
        """Convert error to dictionary."""
        return {
            'code': self.code,
            'message': self.message,
            'details': self.details
        }

class AuthenticationError(AppError):
    """Authentication error."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=401)

class AuthorizationError(AppError):
    """Authorization error."""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message=message, status_code=403)

class InvalidCredentialsError(AppError):
    """Invalid credentials error."""
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message=message, status_code=401)

class UserNotFoundError(AppError):
    """User not found error."""
    def __init__(self, message: str = "User not found"):
        super().__init__(message=message, status_code=404)

class UserAlreadyExistsError(AppError):
    """User already exists error."""
    def __init__(self, message: str = "User with this email already exists"):
        super().__init__(message=message, status_code=409)

class UnauthorizedError(AppError):
    """Unauthorized access error."""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=401)

class ForbiddenError(AppError):
    """Forbidden access error."""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message=message, status_code=403)

class NotFoundError(AppError):
    """Resource not found error."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=404)

class ValidationError(AppError):
    """Validation error."""
    def __init__(self, message: str = "Validation error", details: dict = None):
        super().__init__(message=message, status_code=422)
        self.details = details

class WebSocketError(AppError):
    """WebSocket error."""
    def __init__(self, message: str = "WebSocket error"):
        super().__init__(message=message, status_code=400)

def register_error_handlers(app):
    """Register error handlers with Flask app."""

    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        response = jsonify({
            'code': error.__class__.__name__,
            'message': error.description,
            'details': None
        })
        response.status_code = error.code
        return response

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        response = jsonify({
            'code': 'InternalServerError',
            'message': 'An unexpected error occurred',
            'details': str(error) if app.debug else None
        })
        response.status_code = 500
        return response
