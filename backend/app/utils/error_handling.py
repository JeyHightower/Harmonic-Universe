from flask import jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError, TimeoutError
from functools import wraps
import time
import logging

logger = logging.getLogger(__name__)

class DatabaseError(Exception):
    def __init__(self, message, error_type, status_code=500, original_error=None):
        super().__init__(message)
        self.error_type = error_type
        self.status_code = status_code
        self.original_error = original_error

class RetryableError(DatabaseError):
    pass

def is_retryable_error(error):
    """Determine if an error is retryable."""
    if isinstance(error, (OperationalError, TimeoutError)):
        error_msg = str(error).lower()
        return any(
            term in error_msg
            for term in [
                'deadlock',
                'lock timeout',
                'lost connection',
                'connection reset',
                'operational error',
                'timeout'
            ]
        )
    return False

def with_transaction_retry(max_retries=3, initial_delay=0.1):
    """Decorator for retrying database operations."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            retries = 0
            last_error = None

            while retries <= max_retries:
                try:
                    return f(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if not is_retryable_error(e) or retries == max_retries:
                        break

                    retries += 1
                    delay = initial_delay * (2 ** (retries - 1))  # Exponential backoff
                    logger.warning(
                        f"Retrying database operation after error: {str(e)}. "
                        f"Attempt {retries} of {max_retries}"
                    )
                    time.sleep(delay)

            # If we get here, we've exhausted retries or hit a non-retryable error
            raise handle_database_error(last_error)
        return wrapper
    return decorator

def create_error_response(message, error_type, status_code, details=None, category=None, severity=None):
    """Create a standardized error response with notification information."""
    error_response = {
        'status': 'error',
        'type': error_type,
        'message': message,
        'notification': {
            'type': 'error',
            'message': message,
            'details': details or message,
            'category': category or f'DATABASE_{error_type}',
            'duration': 7000 if severity == 'error' else 5000,
            'severity': severity or 'error'
        }
    }

    if current_app.debug:
        error_response['debug_info'] = {
            'error_type': error_type,
            'details': details
        }

    return jsonify(error_response), status_code

def handle_database_error(error):
    """Handle database-related errors with detailed categorization."""
    if isinstance(error, IntegrityError):
        return create_error_response(
            message='Database integrity error. The operation violates database constraints.',
            error_type='INTEGRITY_ERROR',
            status_code=409,
            details=str(error),
            category='DATABASE_INTEGRITY',
            severity='error'
        )

    elif isinstance(error, OperationalError):
        if is_retryable_error(error):
            return create_error_response(
                message='Temporary database error. Please retry the operation.',
                error_type='RETRYABLE_ERROR',
                status_code=503,
                details=str(error),
                category='DATABASE_RETRY',
                severity='warning'
            )
        else:
            return create_error_response(
                message='Database operation failed. Please try again later.',
                error_type='OPERATIONAL_ERROR',
                status_code=500,
                details=str(error),
                category='DATABASE_OPERATION',
                severity='error'
            )

    elif isinstance(error, TimeoutError):
        return create_error_response(
            message='Database operation timed out. Please try again.',
            error_type='TIMEOUT_ERROR',
            status_code=504,
            details=str(error),
            category='DATABASE_TIMEOUT',
            severity='warning'
        )

    elif isinstance(error, SQLAlchemyError):
        return create_error_response(
            message='Database error occurred. Please try again later.',
            error_type='SQLALCHEMY_ERROR',
            status_code=500,
            details=str(error),
            category='DATABASE_GENERAL',
            severity='error'
        )

    else:
        return create_error_response(
            message=str(error),
            error_type='UNKNOWN_ERROR',
            status_code=500,
            details=str(error),
            category='DATABASE_UNKNOWN',
            severity='error'
        )

def handle_validation_error(error):
    """Handle validation errors."""
    return create_error_response(
        message=str(error),
        error_type='VALIDATION_ERROR',
        status_code=400,
        details=str(error),
        category='VALIDATION',
        severity='warning'
    )

def handle_not_found_error(resource_type):
    """Handle not found errors."""
    return create_error_response(
        message=f'{resource_type} not found',
        error_type='NOT_FOUND',
        status_code=404,
        details=f'The requested {resource_type} could not be found',
        category='NOT_FOUND',
        severity='warning'
    )

def handle_unauthorized_error():
    """Handle unauthorized access errors."""
    return create_error_response(
        message='Unauthorized access',
        error_type='UNAUTHORIZED',
        status_code=403,
        details='You do not have permission to perform this action',
        category='UNAUTHORIZED',
        severity='error'
    )

def handle_rate_limit_error():
    """Handle rate limit exceeded errors."""
    return create_error_response(
        message='Rate limit exceeded. Please try again later.',
        error_type='RATE_LIMIT_EXCEEDED',
        status_code=429,
        details='Too many requests. Please wait before trying again.',
        category='RATE_LIMIT',
        severity='warning'
    )

def handle_file_upload_error(error_type):
    """Handle file upload errors."""
    error_messages = {
        'size': {
            'message': 'File size exceeds maximum limit',
            'details': 'Please upload a smaller file',
            'status_code': 413
        },
        'type': {
            'message': 'Invalid file type',
            'details': 'Please upload a supported file type',
            'status_code': 400
        }
    }

    error_info = error_messages.get(error_type, {
        'message': 'File upload error',
        'details': 'An error occurred during file upload',
        'status_code': 400
    })

    return create_error_response(
        message=error_info['message'],
        error_type='FILE_UPLOAD_ERROR',
        status_code=error_info['status_code'],
        details=error_info['details'],
        category='FILE_UPLOAD',
        severity='warning'
    )

def handle_websocket_error(error_type, details=None):
    """Handle WebSocket-related errors."""
    error_messages = {
        'connection': {
            'message': 'WebSocket connection error',
            'severity': 'error'
        },
        'authentication': {
            'message': 'WebSocket authentication failed',
            'severity': 'error'
        },
        'subscription': {
            'message': 'WebSocket subscription error',
            'severity': 'warning'
        },
        'message': {
            'message': 'Invalid message format',
            'severity': 'warning'
        }
    }

    error_info = error_messages.get(error_type, {
        'message': 'WebSocket error',
        'severity': 'error'
    })

    return {
        'type': 'error',
        'message': error_info['message'],
        'details': details,
        'notification': {
            'type': 'error',
            'message': error_info['message'],
            'details': details or error_info['message'],
            'category': f'WEBSOCKET_{error_type.upper()}',
            'duration': 5000,
            'severity': error_info['severity']
        }
    }
