from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

def handle_database_error(error):
    """Handle database-related errors."""
    if isinstance(error, IntegrityError):
        return jsonify({
            'status': 'error',
            'message': 'Database integrity error. The operation violates database constraints.'
        }), 409
    elif isinstance(error, SQLAlchemyError):
        return jsonify({
            'status': 'error',
            'message': 'Database error occurred. Please try again later.'
        }), 500
    return jsonify({
        'status': 'error',
        'message': str(error)
    }), 500

def handle_validation_error(error):
    """Handle validation errors."""
    return jsonify({
        'status': 'error',
        'message': str(error)
    }), 400

def handle_not_found_error(resource_type):
    """Handle not found errors."""
    return jsonify({
        'status': 'error',
        'message': f'{resource_type} not found'
    }), 404

def handle_unauthorized_error():
    """Handle unauthorized access errors."""
    return jsonify({
        'status': 'error',
        'message': 'Unauthorized access'
    }), 403

def handle_rate_limit_error():
    """Handle rate limit exceeded errors."""
    return jsonify({
        'status': 'error',
        'message': 'Rate limit exceeded. Please try again later.'
    }), 429

def handle_file_upload_error(error_type):
    """Handle file upload errors."""
    if error_type == 'size':
        return jsonify({
            'status': 'error',
            'message': 'File size exceeds maximum limit'
        }), 413
    elif error_type == 'type':
        return jsonify({
            'status': 'error',
            'message': 'Invalid file type'
        }), 400
    return jsonify({
        'status': 'error',
        'message': 'File upload error'
    }), 400

def handle_websocket_error(error_type, details=None):
    """Handle WebSocket-related errors."""
    error_messages = {
        'connection': 'WebSocket connection error',
        'authentication': 'WebSocket authentication failed',
        'subscription': 'WebSocket subscription error',
        'message': 'Invalid message format'
    }
    return {
        'type': 'error',
        'message': error_messages.get(error_type, 'WebSocket error'),
        'details': details
    }
