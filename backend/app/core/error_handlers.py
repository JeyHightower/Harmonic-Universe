"""Error handlers for the application."""

from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException
from .errors import AppError, ValidationError, AuthenticationError, AuthorizationError
import logging

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    """Register error handlers with Flask app."""

    @app.errorhandler(AppError)
    def handle_app_error(error):
        """Handle application-specific errors."""
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Handle validation errors."""
        response = jsonify({
            'error_code': error.error_code,
            'message': str(error),
            'status_code': error.status_code,
            'details': error.details,
            'severity': error.severity.value,
            'category': error.category.value
        })
        response.status_code = error.status_code
        return response

    @app.errorhandler(AuthenticationError)
    def handle_authentication_error(error):
        """Handle authentication errors."""
        response = jsonify({
            'error_code': error.error_code,
            'message': str(error),
            'status_code': error.status_code,
            'details': error.details,
            'severity': error.severity.value,
            'category': error.category.value
        })
        response.status_code = error.status_code
        return response

    @app.errorhandler(AuthorizationError)
    def handle_authorization_error(error):
        """Handle authorization errors."""
        response = jsonify({
            'error_code': error.error_code,
            'message': str(error),
            'status_code': error.status_code,
            'details': error.details,
            'severity': error.severity.value,
            'category': error.category.value
        })
        response.status_code = error.status_code
        return response

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        """Handle HTTP exceptions."""
        response = jsonify({
            'error_code': error.__class__.__name__,
            'message': error.description,
            'status_code': error.code,
            'details': None,
            'severity': 'error',
            'category': 'system'
        })
        response.status_code = error.code
        return response

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle unexpected errors."""
        logger.error(f"Unexpected error: {str(error)}", exc_info=True)
        response = jsonify({
            'error_code': 'INTERNAL_SERVER_ERROR',
            'message': 'An unexpected error occurred',
            'status_code': 500,
            'details': str(error) if current_app.debug else None,
            'severity': 'critical',
            'category': 'system'
        })
        response.status_code = 500
        return response

__all__ = ['register_error_handlers']
