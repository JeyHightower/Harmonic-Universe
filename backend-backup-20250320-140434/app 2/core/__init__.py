"""Core package initialization."""

from .config import Config, config
from .security import create_access_token, verify_access_token
from .auth import get_current_user, get_current_active_user
from .errors import (
    AppError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError
)
from .logging import configure_logging, get_logger
from .error_handling import (
    error_handler,
    ErrorSeverity,
    ErrorCategory,
    ErrorContext,
    ErrorReport
)
from .monitoring import (
    performance_monitor,
    RequestMetrics,
    ResourceMetrics
)
from .rate_limiting import (
    rate_limiter,
    rate_limit,
    RateLimit,
    RateLimitExceeded
)

__all__ = [
    'Config',
    'config',
    'create_access_token',
    'verify_access_token',
    'get_current_user',
    'get_current_active_user',
    'AppError',
    'AuthenticationError',
    'AuthorizationError',
    'NotFoundError',
    'ValidationError',
    'configure_logging',
    'get_logger',
    'error_handler',
    'ErrorSeverity',
    'ErrorCategory',
    'ErrorContext',
    'ErrorReport',
    'performance_monitor',
    'RequestMetrics',
    'ResourceMetrics',
    'rate_limiter',
    'rate_limit',
    'RateLimit',
    'RateLimitExceeded'
]
