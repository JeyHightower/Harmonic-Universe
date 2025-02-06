"""Mocking and assertion test fixtures."""

import pytest
from typing import Dict, Any, Callable
from unittest.mock import Mock, AsyncMock
from fastapi import FastAPI
from fastapi.testclient import TestClient

@pytest.fixture
def mock_app() -> FastAPI:
    """Get a mock FastAPI application."""
    app = FastAPI()

    @app.get("/test")
    def test_endpoint():
        return {"message": "test"}

    return app

@pytest.fixture
def mock_client(mock_app: FastAPI) -> TestClient:
    """Get a mock test client."""
    return TestClient(mock_app)

@pytest.fixture
def mock_db() -> Mock:
    """Get a mock database session."""
    mock = Mock()
    mock.commit = AsyncMock()
    mock.rollback = AsyncMock()
    mock.close = AsyncMock()
    mock.refresh = AsyncMock()
    mock.execute = AsyncMock()
    return mock

@pytest.fixture
def mock_response() -> Callable[..., Dict[str, Any]]:
    """Get a function that creates mock API responses."""
    def _create_response(
        status_code: int = 200,
        data: Any = None,
        headers: Dict[str, str] = None,
        cookies: Dict[str, str] = None
    ) -> Dict[str, Any]:
        return {
            "status_code": status_code,
            "data": data or {},
            "headers": headers or {},
            "cookies": cookies or {}
        }
    return _create_response

@pytest.fixture
def mock_request() -> Callable[..., Dict[str, Any]]:
    """Get a function that creates mock API requests."""
    def _create_request(
        method: str = "GET",
        url: str = "/",
        headers: Dict[str, str] = None,
        cookies: Dict[str, str] = None,
        json: Any = None,
        params: Dict[str, str] = None
    ) -> Dict[str, Any]:
        return {
            "method": method,
            "url": url,
            "headers": headers or {},
            "cookies": cookies or {},
            "json": json,
            "params": params or {}
        }
    return _create_request

@pytest.fixture
def assert_json_response() -> Callable[[Dict[str, Any], Dict[str, Any]], None]:
    """Get a function that asserts JSON response equality."""
    def _assert_json(actual: Dict[str, Any], expected: Dict[str, Any]) -> None:
        assert actual.keys() == expected.keys(), "Response keys don't match"
        for key in actual:
            assert actual[key] == expected[key], f"Value mismatch for key '{key}'"
    return _assert_json

@pytest.fixture
def assert_error_response() -> Callable[[Dict[str, Any], int, str], None]:
    """Get a function that asserts error response format."""
    def _assert_error(
        response: Dict[str, Any],
        status_code: int,
        detail: str
    ) -> None:
        assert response["status_code"] == status_code, "Status code mismatch"
        assert response["detail"] == detail, "Error detail mismatch"
    return _assert_error
