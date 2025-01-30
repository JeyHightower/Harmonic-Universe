"""Error handlers for the application."""
from flask import jsonify
from werkzeug.exceptions import HTTPException

def register_error_handlers(app):
    """Register error handlers with the Flask application."""

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        """Handle HTTP exceptions."""
        response = {
            'error': error.name,
            'message': error.description
        }
        return jsonify(response), error.code

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle generic exceptions."""
        app.logger.error(f'Unhandled exception: {str(error)}')
        response = {
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }
        return jsonify(response), 500

    @app.errorhandler(404)
    def not_found_error(error):
        """Handle 404 errors."""
        response = {
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }
        return jsonify(response), 404

    @app.errorhandler(400)
    def bad_request_error(error):
        """Handle 400 errors."""
        response = {
            'error': 'Bad Request',
            'message': str(error.description)
        }
        return jsonify(response), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        """Handle 401 errors."""
        app.logger.error(f"Unauthorized error occurred: {str(error)}")
        app.logger.error(f"Error type: {type(error)}")
        app.logger.error(f"Error description: {getattr(error, 'description', 'No description')}")
        response = {
            'error': 'Unauthorized',
            'message': 'Authentication is required'
        }
        return jsonify(response), 401

    @app.errorhandler(403)
    def forbidden_error(error):
        """Handle 403 errors."""
        response = {
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource'
        }
        return jsonify(response), 403
