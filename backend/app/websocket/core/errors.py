from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, ValidationError
from fastapi import WebSocket

class ErrorCode(str, Enum):
    """Enumeration of WebSocket error codes."""
    WEBSOCKET_CONNECTION_ERROR = "WEBSOCKET_CONNECTION_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INVALID_MESSAGE_FORMAT = "INVALID_MESSAGE_FORMAT"
    ROOM_ERROR = "ROOM_ERROR"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"

class ErrorResponse(BaseModel):
    """Model for error responses."""
    code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None

class WebSocketError(Exception):
    """Custom exception for WebSocket errors."""
    def __init__(self, code: ErrorCode, message: str, details: Optional[Dict[str, Any]] = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)

async def handle_validation_error(websocket: WebSocket, error: ValidationError) -> None:
    """Handle validation errors in WebSocket messages."""
    error_response = ErrorResponse(
        code=ErrorCode.VALIDATION_ERROR,
        message="Invalid message format",
        details={"errors": error.errors()}
    )
    await websocket.send_json(error_response.dict())
