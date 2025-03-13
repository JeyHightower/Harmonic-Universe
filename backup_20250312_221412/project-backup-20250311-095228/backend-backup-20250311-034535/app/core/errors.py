"""Core error classes for the application."""

from enum import Enum
from typing import Any, Dict, List, Optional


class ErrorSeverity(str, Enum):
    """Error severity levels."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorCategory(str, Enum):
    """Error categories."""

    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATABASE = "database"
    BUSINESS_LOGIC = "business_logic"
    EXTERNAL_SERVICE = "external_service"
    SYSTEM = "system"


class AppError(Exception):
    """Base application error."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        category: ErrorCategory = ErrorCategory.SYSTEM,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        self.severity = severity
        self.category = category

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary format."""
        return {
            "message": self.message,
            "status_code": self.status_code,
            "error_code": self.error_code,
            "details": self.details,
            "severity": self.severity.value,
            "category": self.category.value,
        }


class ValidationError(AppError):
    """Validation error."""

    def __init__(
        self,
        message: str = "Validation error",
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=400,
            error_code=error_code or "VALIDATION_ERROR",
            details=details,
            severity=ErrorSeverity.WARNING,
            category=ErrorCategory.VALIDATION,
        )


class AuthenticationError(AppError):
    """Authentication error."""

    def __init__(
        self, message: str = "Authentication error", error_code: Optional[str] = None
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code=error_code or "AUTHENTICATION_ERROR",
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.AUTHENTICATION,
        )


class AuthorizationError(AppError):
    """Authorization error."""

    def __init__(
        self, message: str = "Authorization error", error_code: Optional[str] = None
    ):
        super().__init__(
            message=message,
            status_code=403,
            error_code=error_code or "AUTHORIZATION_ERROR",
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.AUTHORIZATION,
        )


class InvalidCredentialsError(AuthenticationError):
    """Invalid credentials error."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message=message, error_code="INVALID_CREDENTIALS")


class NotFoundError(AppError):
    """Resource not found error."""

    def __init__(
        self, message: str = "Resource not found", error_code: Optional[str] = None
    ):
        super().__init__(
            message=message,
            status_code=404,
            error_code=error_code or "NOT_FOUND",
            severity=ErrorSeverity.WARNING,
            category=ErrorCategory.BUSINESS_LOGIC,
        )


class UserNotFoundError(NotFoundError):
    """User not found error."""

    def __init__(self, message: str = "User not found"):
        super().__init__(message=message, error_code="USER_NOT_FOUND")


class UserAlreadyExistsError(AppError):
    """User already exists error."""

    def __init__(self, message: str = "User already exists"):
        super().__init__(
            message=message,
            status_code=409,
            error_code="USER_ALREADY_EXISTS",
            severity=ErrorSeverity.WARNING,
            category=ErrorCategory.VALIDATION,
        )


class DatabaseError(AppError):
    """Database error."""

    def __init__(
        self,
        message: str = "Database error",
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=500,
            error_code=error_code or "DATABASE_ERROR",
            details=details,
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.DATABASE,
        )


class WebSocketError(AppError):
    """WebSocket error."""

    def __init__(
        self,
        message: str = "WebSocket error",
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=500,
            error_code=error_code or "WEBSOCKET_ERROR",
            details=details,
            severity=ErrorSeverity.ERROR,
            category=ErrorCategory.SYSTEM,
        )


# Export all error classes
__all__ = [
    "ErrorSeverity",
    "ErrorCategory",
    "AppError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "InvalidCredentialsError",
    "NotFoundError",
    "UserNotFoundError",
    "UserAlreadyExistsError",
    "DatabaseError",
    "WebSocketError",
]
