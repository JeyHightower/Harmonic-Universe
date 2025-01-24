"""Error handlers module."""
from flask import jsonify
from werkzeug.exceptions import HTTPException

def register_error_handlers(app):
    """Register error handlers for the application."""

    @app.errorhandler(400)
    def bad_request_error(error):
        """Handle bad request errors."""
        return jsonify({
            'error': 'Bad Request',
            'message': str(error.description)
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        """Handle unauthorized errors."""
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401

    @app.errorhandler(403)
    def forbidden_error(error):
        """Handle forbidden errors."""
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource'
        }), 403

    @app.errorhandler(404)
    def not_found_error(error):
        """Handle not found errors."""
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404

    @app.errorhandler(422)
    def unprocessable_entity_error(error):
        """Handle unprocessable entity errors."""
        return jsonify({
            'error': 'Unprocessable Entity',
            'message': str(error.description)
        }), 422

    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle internal server errors."""
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500

    @app.errorhandler(HTTPException)
    def handle_exception(error):
        """Handle all other HTTP exceptions."""
        return jsonify({
            'error': error.name,
            'message': error.description
        }), error.code

    return app
