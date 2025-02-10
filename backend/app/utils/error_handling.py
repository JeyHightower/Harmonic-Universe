"""Error handling utility functions."""

from typing import Any, Dict, List, Optional, Type, Union
from enum import Enum
import traceback
from datetime import datetime
import logging
from functools import wraps

# Error severity levels
class ErrorSeverity(str, Enum):
    """Error severity levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

# Error categories
class ErrorCategory(str, Enum):
    """Error categories."""
    VALIDATION = "VALIDATION"
    AUTHENTICATION = "AUTHENTICATION"
    AUTHORIZATION = "AUTHORIZATION"
    DATABASE = "DATABASE"
    NETWORK = "NETWORK"
    SYSTEM = "SYSTEM"
    BUSINESS = "BUSINESS"
    EXTERNAL = "EXTERNAL"

class AppError(Exception):
    """Base application error."""
    def __init__(self,
                 message: str,
                 code: str = "UNKNOWN_ERROR",
                 severity: ErrorSeverity = ErrorSeverity.ERROR,
                 category: ErrorCategory = ErrorCategory.SYSTEM,
                 details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.severity = severity
        self.category = category
        self.details = details or {}
        self.timestamp = datetime.utcnow()

class ValidationError(AppError):
    """Validation error."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            severity=ErrorSeverity.WARNING,
            category=ErrorCategory.VALIDATION,
            details=details
        )

class AuthenticationError(AppError):
    """Authentication error."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.AUTHENTICATION,
            details=details
        )

class AuthorizationError(AppError):
    """Authorization error."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.AUTHORIZATION,
            details=details
        )

class DatabaseError(AppError):
    """Database error."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.DATABASE,
            details=details
        )

def handle_exceptions(logger: logging.Logger):
    """Decorator to handle exceptions and log them."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except AppError as e:
                logger.log(
                    logging.getLevelName(e.severity.value),
                    f"{e.category.value} - {e.code}: {e.message}",
                    extra={
                        'error_details': e.details,
                        'timestamp': e.timestamp.isoformat()
                    }
                )
                raise
            except Exception as e:
                logger.error(
                    f"Unexpected error: {str(e)}",
                    extra={
                        'traceback': traceback.format_exc(),
                        'timestamp': datetime.utcnow().isoformat()
                    }
                )
                raise AppError(
                    message=str(e),
                    severity=ErrorSeverity.ERROR,
                    category=ErrorCategory.SYSTEM
                )
        return wrapper
    return decorator

def validate_or_raise(condition: bool,
                     message: str,
                     error_class: Type[AppError] = ValidationError,
                     details: Optional[Dict[str, Any]] = None) -> None:
    """Validate a condition or raise an error."""
    if not condition:
        raise error_class(message=message, details=details)

def format_error_response(error: AppError) -> Dict[str, Any]:
    """Format error for API response."""
    return {
        'error': {
            'code': error.code,
            'message': error.message,
            'severity': error.severity.value,
            'category': error.category.value,
            'details': error.details,
            'timestamp': error.timestamp.isoformat()
        }
    }

def aggregate_errors(errors: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate multiple errors into a single response."""
    return {
        'errors': errors,
        'count': len(errors),
        'timestamp': datetime.utcnow().isoformat()
    }

def safe_execute(func: callable,
                 default_value: Any = None,
                 error_handler: Optional[callable] = None,
                 logger: Optional[logging.Logger] = None) -> Any:
    """Safely execute a function with error handling."""
    try:
        return func()
    except Exception as e:
        if logger:
            logger.error(f"Error executing {func.__name__}: {str(e)}")
        if error_handler:
            return error_handler(e)
        return default_value

def retry_on_error(max_attempts: int = 3,
                  delay_seconds: float = 1.0,
                  allowed_exceptions: tuple = (Exception,),
                  logger: Optional[logging.Logger] = None):
    """Decorator to retry a function on error."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except allowed_exceptions as e:
                    if logger:
                        logger.warning(
                            f"Attempt {attempt + 1}/{max_attempts} failed: {str(e)}"
                        )
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay_seconds * (attempt + 1))
        return wrapper
    return decorator
