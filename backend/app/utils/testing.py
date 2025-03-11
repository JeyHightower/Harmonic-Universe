"""Testing utility functions."""

import random
import string
from typing import Any, Dict, List, Optional, Type, Union
from datetime import datetime, timedelta
import json
import pytest
from sqlalchemy.orm import Session
from pathlib import Path
import tempfile
import shutil
import contextlib
import logging
from unittest.mock import MagicMock, patch

from backend.app.db.base import Base
from backend.app.core.config import get_settings


def random_string(length: int = 10) -> str:
    """Generate a random string."""
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for _ in range(length))


def random_email() -> str:
    """Generate a random email address."""
    return f"{random_string()}@example.com"


def random_password(length: int = 12) -> str:
    """Generate a random password."""
    characters = string.ascii_letters + string.digits + string.punctuation
    while True:
        password = "".join(random.choice(characters) for _ in range(length))
        if (
            any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in string.punctuation for c in password)
        ):
            return password


def random_phone() -> str:
    """Generate a random phone number."""
    return f"+1{''.join(random.choice(string.digits) for _ in range(10))}"


def random_date(start_date: datetime, end_date: datetime) -> datetime:
    """Generate a random date between start_date and end_date."""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def temp_file():
    """Create a temporary file for tests."""
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    yield temp_file.name
    Path(temp_file.name).unlink()


@contextlib.contextmanager
def mock_datetime(target, mock_datetime: datetime):
    """Context manager to mock datetime in tests."""
    with patch(target) as mock:
        mock.utcnow = MagicMock(return_value=mock_datetime)
        mock.now = MagicMock(return_value=mock_datetime)
        yield mock


def create_test_db(db: Session, base: Type[Base]) -> None:
    """Create test database tables."""
    base.metadata.create_all(bind=db.get_bind())


def drop_test_db(db: Session, base: Type[Base]) -> None:
    """Drop test database tables."""
    base.metadata.drop_all(bind=db.get_bind())


class MockResponse:
    """Mock response for testing HTTP requests."""

    def __init__(
        self,
        status_code: int = 200,
        json_data: Optional[Dict] = None,
        content: Optional[bytes] = None,
        headers: Optional[Dict] = None,
    ):
        self.status_code = status_code
        self._json_data = json_data
        self.content = content or b""
        self.headers = headers or {}
        self.text = content.decode() if content else ""

    def json(self) -> Dict:
        """Get JSON response data."""
        return self._json_data

    def raise_for_status(self) -> None:
        """Raise an exception for error status codes."""
        if self.status_code >= 400:
            raise Exception(f"HTTP Error: {self.status_code}")


class TestClient:
    """Test client for API testing."""

    def __init__(self, app):
        self.app = app
        self.base_url = "http://testserver"
        self._cookies = {}
        self._headers = {}

    def get(self, url: str, **kwargs) -> MockResponse:
        """Simulate GET request."""
        return self._request("GET", url, **kwargs)

    def post(self, url: str, **kwargs) -> MockResponse:
        """Simulate POST request."""
        return self._request("POST", url, **kwargs)

    def put(self, url: str, **kwargs) -> MockResponse:
        """Simulate PUT request."""
        return self._request("PUT", url, **kwargs)

    def delete(self, url: str, **kwargs) -> MockResponse:
        """Simulate DELETE request."""
        return self._request("DELETE", url, **kwargs)

    def _request(self, method: str, url: str, **kwargs) -> MockResponse:
        headers = {**self._headers, **(kwargs.pop("headers", {}))}
        cookies = {**self._cookies, **(kwargs.pop("cookies", {}))}

        response = self.app.test_client().open(
            url, method=method, headers=headers, cookies=cookies, **kwargs
        )

        return MockResponse(
            status_code=response.status_code,
            json_data=response.get_json(),
            content=response.data,
            headers=dict(response.headers),
        )


@pytest.fixture
def test_client(app):
    """Create test client fixture."""
    return TestClient(app)


def assert_json_response(response: MockResponse, expected: Dict) -> None:
    """Assert JSON response matches expected data."""
    assert response.status_code == 200
    assert response.json() == expected


def assert_error_response(
    response: MockResponse, status_code: int, error_code: Optional[str] = None
) -> None:
    """Assert error response is correct."""
    assert response.status_code == status_code
    if error_code:
        assert response.json()["error"]["code"] == error_code


class TestLogger:
    """Logger for testing."""

    def __init__(self):
        self.logs: List[Dict] = []

    def debug(self, message: str, *args, **kwargs) -> None:
        """Log debug message."""
        self._log("DEBUG", message, *args, **kwargs)

    def info(self, message: str, *args, **kwargs) -> None:
        """Log info message."""
        self._log("INFO", message, *args, **kwargs)

    def warning(self, message: str, *args, **kwargs) -> None:
        """Log warning message."""
        self._log("WARNING", message, *args, **kwargs)

    def error(self, message: str, *args, **kwargs) -> None:
        """Log error message."""
        self._log("ERROR", message, *args, **kwargs)

    def _log(self, level: str, message: str, *args, **kwargs) -> None:
        """Internal log method."""
        self.logs.append(
            {
                "level": level,
                "message": message % args if args else message,
                "timestamp": datetime.utcnow().isoformat(),
                "extra": kwargs.get("extra", {}),
            }
        )

    def clear(self) -> None:
        """Clear all logs."""
        self.logs.clear()

    def get_logs(self, level: Optional[str] = None) -> List[Dict]:
        """Get logs, optionally filtered by level."""
        if level:
            return [log for log in self.logs if log["level"] == level.upper()]
        return self.logs


@pytest.fixture
def test_logger():
    """Create test logger fixture."""
    return TestLogger()
