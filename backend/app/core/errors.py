"""
Custom error handling module.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status

class BaseAppError(Exception):
    """Base error class for application errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(BaseAppError):
    """Raised when data validation fails."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)

class NotFoundError(BaseAppError):
    """Raised when a resource is not found."""
    def __init__(self, resource: str, resource_id: Any):
        super().__init__(
            message=f"{resource} with id {resource_id} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

class AuthenticationError(BaseAppError):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)

class AuthorizationError(BaseAppError):
    """Raised when user doesn't have required permissions."""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)

class DatabaseError(BaseAppError):
    """Raised when database operations fail."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

class FileOperationError(BaseAppError):
    """Raised when file operations fail."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, details=details)

def handle_app_error(error: BaseAppError) -> Dict[str, Any]:
    """Convert application error to response format."""
    return {
        "error": {
            "message": error.message,
            "type": error.__class__.__name__,
            "details": error.details
        }
    }

def get_http_exception(error: BaseAppError) -> HTTPException:
    """Convert application error to FastAPI HTTPException."""
    return HTTPException(
        status_code=error.status_code,
        detail=handle_app_error(error)
    )
