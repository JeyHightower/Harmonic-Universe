"""Error handling module for the application."""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status

class AppError(Exception):
    """Base exception class for application errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(self.message)

class ErrorResponse:
    """Standard error response format."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert error response to dictionary format."""
        return {
            "error": {
                "message": self.message,
                "status_code": self.status_code,
                "detail": self.detail
            }
        }

    @classmethod
    def from_exception(cls, exc: Exception) -> "ErrorResponse":
        """Create an ErrorResponse from an exception."""
        if isinstance(exc, AppError):
            return cls(
                message=exc.message,
                status_code=exc.status_code,
                detail=exc.detail
            )
        elif isinstance(exc, HTTPException):
            return cls(
                message=str(exc.detail),
                status_code=exc.status_code
            )
        else:
            return cls(
                message=str(exc),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
