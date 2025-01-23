from flask import current_app, jsonify, request
from flask_socketio import emit
from werkzeug.exceptions import (
    NotFound,
    Unauthorized,
    BadRequest,
    RequestTimeout,
    RequestEntityTooLarge,
    TooManyRequests,
    UnsupportedMediaType,
    HTTPException
)
from flask_jwt_extended.exceptions import (
    JWTExtendedException,
    NoAuthorizationError,
    InvalidHeaderError,
    CSRFError,
    WrongTokenError,
    RevokedTokenError,
    FreshTokenRequired,
    UserLookupError
)
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging
from ..extensions import db
import json

logger = logging.getLogger(__name__)

def handle_websocket_error(error, context=None):
    """Handle WebSocket errors with logging and client notification.

    Args:
        error: The exception that occurred
        context: Optional string describing where the error occurred
    """
    error_message = str(error)
    error_type = type(error).__name__

    # Log the error with context
    if context:
        current_app.logger.error(f"WebSocket error in {context}: {error_type} - {error_message}")
    else:
        current_app.logger.error(f"WebSocket error: {error_type} - {error_message}")

    # Send error to client
    error_data = {
        'type': error_type,
        'message': error_message
    }

    if context:
        error_data['context'] = context

    try:
        emit('error', error_data)
    except Exception as e:
        # If emit fails, just log it
        current_app.logger.error(f"Failed to emit error to client: {str(e)}")

def handle_db_error(error, context=None):
    """Handle database errors with logging and client notification.

    Args:
        error: The exception that occurred
        context: Optional string describing where the error occurred
    """
    error_message = str(error)
    error_type = type(error).__name__

    # Log the error with context
    if context:
        current_app.logger.error(f"Database error in {context}: {error_type} - {error_message}")
    else:
        current_app.logger.error(f"Database error: {error_type} - {error_message}")

    # Send error to client
    error_data = {
        'type': error_type,
        'message': "A database error occurred. Please try again later."
    }

    if context:
        error_data['context'] = context

    try:
        emit('error', error_data)
    except Exception as e:
        # If emit fails, just log it
        current_app.logger.error(f"Failed to emit error to client: {str(e)}")

def handle_validation_error(error, context=None):
    """Handle validation errors with logging and client notification.

    Args:
        error: The exception that occurred
        context: Optional string describing where the error occurred
    """
    error_message = str(error)
    error_type = type(error).__name__

    # Log the error with context
    if context:
        current_app.logger.error(f"Validation error in {context}: {error_type} - {error_message}")
    else:
        current_app.logger.error(f"Validation error: {error_type} - {error_message}")

    # Send error to client
    error_data = {
        'type': error_type,
        'message': error_message
    }

    if context:
        error_data['context'] = context

    try:
        emit('error', error_data)
    except Exception as e:
        # If emit fails, just log it
        current_app.logger.error(f"Failed to emit error to client: {str(e)}")

def handle_auth_error(error, context=None):
    """Handle authentication errors with logging and client notification.

    Args:
        error: The exception that occurred
        context: Optional string describing where the error occurred
    """
    error_message = str(error)
    error_type = type(error).__name__

    # Log the error with context
    if context:
        current_app.logger.error(f"Authentication error in {context}: {error_type} - {error_message}")
    else:
        current_app.logger.error(f"Authentication error: {error_type} - {error_message}")

    # Send error to client
    error_data = {
        'type': error_type,
        'message': "Authentication failed. Please log in again."
    }

    if context:
        error_data['context'] = context

    try:
        emit('error', error_data)
    except Exception as e:
        # If emit fails, just log it
        current_app.logger.error(f"Failed to emit error to client: {str(e)}")

def handle_rate_limit_error(error, context=None):
    """Handle rate limit errors with logging and client notification.

    Args:
        error: The exception that occurred
        context: Optional string describing where the error occurred
    """
    error_message = str(error)
    error_type = type(error).__name__

    # Log the error with context
    if context:
        current_app.logger.error(f"Rate limit error in {context}: {error_type} - {error_message}")
    else:
        current_app.logger.error(f"Rate limit error: {error_type} - {error_message}")

    # Send error to client
    error_data = {
        'type': error_type,
        'message': "Too many requests. Please try again later."
    }

    if context:
        error_data['context'] = context

    try:
        emit('error', error_data)
    except Exception as e:
        # If emit fails, just log it
        current_app.logger.error(f"Failed to emit error to client: {str(e)}")

def handle_generic_error(error, context=None):
    """Handle generic errors with logging and client notification.

    Args:
        error: The exception that occurred
        context: Optional string describing where the error occurred
    """
    error_message = str(error)
    error_type = type(error).__name__

    # Log the error with context
    if context:
        current_app.logger.error(f"Error in {context}: {error_type} - {error_message}")
    else:
        current_app.logger.error(f"Error: {error_type} - {error_message}")

    # Send error to client
    error_data = {
        'type': error_type,
        'message': "An unexpected error occurred. Please try again later."
    }

    if context:
        error_data['context'] = context

    try:
        emit('error', error_data)
    except Exception as e:
        # If emit fails, just log it
        current_app.logger.error(f"Failed to emit error to client: {str(e)}")

def get_error_handler(error):
    """Get the appropriate error handler based on error type.

    Args:
        error: The exception that occurred

    Returns:
        function: The appropriate error handler function
    """
    error_type = type(error).__name__

    handlers = {
        'WebSocketError': handle_websocket_error,
        'SQLAlchemyError': handle_db_error,
        'ValidationError': handle_validation_error,
        'AuthenticationError': handle_auth_error,
        'RateLimitError': handle_rate_limit_error
    }

    return handlers.get(error_type, handle_generic_error)

def register_error_handlers(app):
    """Register error handlers for the application."""

    @app.errorhandler(400)
    def handle_bad_request(error):
        """Handle bad request errors."""
        response = {
            'status': 'error',
            'error': 'Bad Request',
            'message': str(error.description) if hasattr(error, 'description') else 'Invalid request'
        }
        return jsonify(response), 400

    @app.errorhandler(401)
    def handle_unauthorized(error):
        """Handle unauthorized access errors."""
        response = {
            'status': 'error',
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }
        return jsonify(response), 401

    @app.errorhandler(403)
    def handle_forbidden(error):
        """Handle forbidden access errors."""
        response = {
            'status': 'error',
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource'
        }
        return jsonify(response), 403

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle not found errors."""
        response = {
            'status': 'error',
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }
        return jsonify(response), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle method not allowed errors."""
        response = {
            'status': 'error',
            'error': 'Method Not Allowed',
            'message': f'The method {request.method} is not allowed for this endpoint'
        }
        return jsonify(response), 405

    @app.errorhandler(413)
    def handle_request_entity_too_large(error):
        """Handle request entity too large errors."""
        response = {
            'status': 'error',
            'error': 'Request Entity Too Large',
            'message': 'The request is too large'
        }
        return jsonify(response), 413

    @app.errorhandler(415)
    def handle_unsupported_media_type(error):
        """Handle unsupported media type errors."""
        response = {
            'status': 'error',
            'error': 'Unsupported Media Type',
            'message': 'Content type must be application/json'
        }
        return jsonify(response), 415

    @app.errorhandler(429)
    def handle_rate_limit_exceeded(error):
        """Handle rate limit exceeded errors."""
        response = {
            'status': 'error',
            'error': 'Too Many Requests',
            'message': 'Rate limit exceeded. Please try again later.'
        }
        return jsonify(response), 429

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        """Handle internal server errors."""
        response = {
            'status': 'error',
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }
        return jsonify(response), 500

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error):
        """Handle database errors."""
        db.session.rollback()  # Roll back the session
        response = {
            'status': 'error',
            'error': 'Database Error',
            'message': 'A database error occurred'
        }
        return jsonify(response), 500

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        """Handle database integrity errors."""
        db.session.rollback()  # Roll back the session
        response = {
            'status': 'error',
            'error': 'Integrity Error',
            'message': 'A database integrity error occurred'
        }
        return jsonify(response), 400

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle all other unhandled exceptions."""
        app.logger.error(f'Unhandled error: {str(error)}')
        response = {
            'status': 'error',
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }
        return jsonify(response), 500

    def validate_json(request):
        """Validate that the request contains valid JSON data."""
        if not request.is_json:
            response = {
                'status': 'error',
                'error': 'Unsupported Media Type',
                'message': 'Content type must be application/json'
            }
            return jsonify(response), 415

        try:
            request.get_json()
        except Exception:
            response = {
                'status': 'error',
                'error': 'Bad Request',
                'message': 'Invalid JSON format'
            }
            return jsonify(response), 400

        return None

    # JWT Error Handlers
    @app.errorhandler(JWTExtendedException)
    def handle_jwt_extended_error(e):
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 401

    @app.errorhandler(InvalidHeaderError)
    def handle_invalid_header_error(e):
        return jsonify({
            'status': 'error',
            'message': 'Invalid token header'
        }), 401

    @app.errorhandler(NoAuthorizationError)
    def handle_no_auth_error(e):
        return jsonify({
            'status': 'error',
            'message': 'No authorization token provided'
        }), 401

    @app.errorhandler(WrongTokenError)
    def handle_wrong_token_error(e):
        return jsonify({
            'status': 'error',
            'message': 'Wrong token type'
        }), 401

    @app.errorhandler(RevokedTokenError)
    def handle_revoked_token_error(e):
        return jsonify({
            'status': 'error',
            'message': 'Token has been revoked'
        }), 401

    @app.errorhandler(FreshTokenRequired)
    def handle_fresh_token_required(e):
        return jsonify({
            'status': 'error',
            'message': 'Fresh token required'
        }), 401

    @app.errorhandler(UserLookupError)
    def handle_user_lookup_error(e):
        return jsonify({
            'status': 'error',
            'message': 'Error loading user'
        }), 401
