"""
Standardized error handling system.
"""
from typing import Any, Dict, Optional, List, Union
from fastapi import HTTPException, status
from pydantic import BaseModel, ValidationError as PydanticValidationError

class ErrorCode:
    """Error codes for the application."""
    # Authentication errors
    AUTHENTICATION_REQUIRED = "AUTH_001"
    INVALID_CREDENTIALS = "AUTH_002"
    TOKEN_EXPIRED = "AUTH_003"
    INSUFFICIENT_PERMISSIONS = "AUTH_004"

    # Database errors
    DATABASE_ERROR = "DB_001"
    RECORD_NOT_FOUND = "DB_002"
    DUPLICATE_ENTRY = "DB_003"
    INTEGRITY_ERROR = "DB_004"

    # Validation errors
    VALIDATION_ERROR = "VAL_001"
    INVALID_INPUT = "VAL_002"
    MISSING_FIELD = "VAL_003"
    TYPE_ERROR = "VAL_004"
    RANGE_ERROR = "VAL_005"
    FORMAT_ERROR = "VAL_006"
    UNIQUE_ERROR = "VAL_007"
    DEPENDENCY_ERROR = "VAL_008"

    # WebSocket errors
    WEBSOCKET_CONNECTION_ERROR = "WS_001"
    WEBSOCKET_AUTH_ERROR = "WS_002"
    WEBSOCKET_RATE_LIMIT = "WS_003"

    # Business logic errors
    INVALID_OPERATION = "BUS_001"
    RESOURCE_LOCKED = "BUS_002"
    QUOTA_EXCEEDED = "BUS_003"

class ValidationErrorDetail(BaseModel):
    """Detailed validation error information."""
    field: str
    error_code: str
    message: str
    context: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    """Standardized error response model."""
    code: str
    message: str
    details: Optional[Union[Dict[str, Any], List[ValidationErrorDetail]]] = None

class AppError(Exception):
    """Base application error."""
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Union[Dict[str, Any], List[ValidationErrorDetail]]] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)

class AuthenticationError(AppError):
    """Authentication related errors."""
    def __init__(
        self,
        code: str = ErrorCode.AUTHENTICATION_REQUIRED,
        message: str = "Authentication required",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )

class PermissionError(AppError):
    """Permission related errors."""
    def __init__(
        self,
        code: str = ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: str = "Insufficient permissions",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )

class ValidationError(AppError):
    """Enhanced validation error with detailed information."""
    def __init__(
        self,
        message: str = "Validation error",
        details: Optional[List[ValidationErrorDetail]] = None,
        code: str = ErrorCode.VALIDATION_ERROR
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )

    @classmethod
    def from_pydantic_error(cls, error: PydanticValidationError) -> 'ValidationError':
        """Convert Pydantic validation error to application validation error."""
        details = []
        for err in error.errors():
            error_detail = ValidationErrorDetail(
                field=".".join(str(loc) for loc in err["loc"]),
                error_code=cls._map_pydantic_error_type(err["type"]),
                message=err["msg"],
                context={"input": err.get("input"), "ctx": err.get("ctx")}
            )
            details.append(error_detail)
        return cls(details=details)

    @staticmethod
    def _map_pydantic_error_type(error_type: str) -> str:
        """Map Pydantic error types to application error codes."""
        error_map = {
            "type_error": ErrorCode.TYPE_ERROR,
            "value_error": ErrorCode.INVALID_INPUT,
            "missing": ErrorCode.MISSING_FIELD,
            "range_error": ErrorCode.RANGE_ERROR,
            "format_error": ErrorCode.FORMAT_ERROR,
            "unique_error": ErrorCode.UNIQUE_ERROR,
            "dependency_error": ErrorCode.DEPENDENCY_ERROR
        }
        return error_map.get(error_type, ErrorCode.VALIDATION_ERROR)

class DatabaseError(AppError):
    """Database related errors."""
    def __init__(
        self,
        code: str = ErrorCode.DATABASE_ERROR,
        message: str = "Database error",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )

class NotFoundError(AppError):
    """Resource not found errors."""
    def __init__(
        self,
        code: str = ErrorCode.RECORD_NOT_FOUND,
        message: str = "Resource not found",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )

class WebSocketError(AppError):
    """WebSocket related errors."""
    def __init__(
        self,
        code: str = ErrorCode.WEBSOCKET_CONNECTION_ERROR,
        message: str = "WebSocket error",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )

def handle_app_error(error: AppError) -> ErrorResponse:
    """Convert application error to error response."""
    return ErrorResponse(
        code=error.code,
        message=error.message,
        details=error.details
    )

def handle_validation_error(error: Any) -> ErrorResponse:
    """Enhanced validation error handling."""
    if isinstance(error, PydanticValidationError):
        validation_error = ValidationError.from_pydantic_error(error)
        return ErrorResponse(
            code=validation_error.code,
            message=validation_error.message,
            details=validation_error.details
        )
    return ErrorResponse(
        code=ErrorCode.VALIDATION_ERROR,
        message="Validation error",
        details={"errors": str(error)}
    )

def handle_database_error(error: Any) -> ErrorResponse:
    """Handle database errors with more context."""
    error_message = str(error)
    error_code = ErrorCode.DATABASE_ERROR
    details = {"error": error_message}

    # Detect specific database error types
    if "duplicate key" in error_message.lower():
        error_code = ErrorCode.DUPLICATE_ENTRY
    elif "foreign key" in error_message.lower():
        error_code = ErrorCode.INTEGRITY_ERROR
    elif "not found" in error_message.lower():
        error_code = ErrorCode.RECORD_NOT_FOUND

    return ErrorResponse(
        code=error_code,
        message="Database error occurred",
        details=details
    )
