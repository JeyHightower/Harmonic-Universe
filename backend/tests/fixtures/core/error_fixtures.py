"""Error handling test fixtures."""

import pytest
from typing import Dict, Any, Callable
from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

@pytest.fixture
def test_http_errors() -> Dict[str, HTTPException]:
    """Get common HTTP errors for testing."""
    return {
        "not_found": HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        ),
        "unauthorized": HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        ),
        "forbidden": HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        ),
        "bad_request": HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request"
        ),
        "conflict": HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource already exists"
        )
    }

@pytest.fixture
def test_validation_errors() -> Dict[str, Dict[str, Any]]:
    """Get common validation error data for testing."""
    return {
        "missing_field": {
            "loc": ("field_name",),
            "msg": "field required",
            "type": "value_error.missing"
        },
        "invalid_type": {
            "loc": ("field_name",),
            "msg": "value is not a valid type",
            "type": "type_error"
        },
        "invalid_format": {
            "loc": ("field_name",),
            "msg": "invalid format",
            "type": "value_error.format"
        },
        "invalid_length": {
            "loc": ("field_name",),
            "msg": "length must be between min and max",
            "type": "value_error.length"
        }
    }

@pytest.fixture
def test_db_errors() -> Dict[str, SQLAlchemyError]:
    """Get common database errors for testing."""
    return {
        "integrity_error": SQLAlchemyError("Integrity Error"),
        "connection_error": SQLAlchemyError("Connection Error"),
        "timeout_error": SQLAlchemyError("Timeout Error"),
        "not_found_error": SQLAlchemyError("Not Found Error"),
        "validation_error": SQLAlchemyError("Validation Error")
    }

@pytest.fixture
def error_handler() -> Callable[[Exception], Dict[str, Any]]:
    """Get a function that formats errors for testing."""
    def _handle_error(error: Exception) -> Dict[str, Any]:
        if isinstance(error, HTTPException):
            return {
                "status_code": error.status_code,
                "detail": error.detail,
                "headers": error.headers
            }
        elif isinstance(error, ValidationError):
            return {
                "status_code": 422,
                "detail": error.errors(),
                "body": error.json()
            }
        elif isinstance(error, SQLAlchemyError):
            return {
                "status_code": 500,
                "detail": str(error),
                "error_type": error.__class__.__name__
            }
        return {
            "status_code": 500,
            "detail": str(error),
            "error_type": "UnhandledError"
        }
    return _handle_error
