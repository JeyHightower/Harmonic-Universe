from flask import current_app
from flask_socketio import emit

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
