"""Utility test fixtures."""

import pytest
from typing import Dict, Any, Callable
import random
import string
import uuid
import json
from datetime import datetime, timezone
from pathlib import Path

@pytest.fixture
def random_string() -> Callable[[], str]:
    """Get a function that generates random strings."""
    def _generate(length: int = 32) -> str:
        return "".join(random.choices(string.ascii_letters + string.digits, k=length))
    return _generate

@pytest.fixture
def random_email() -> Callable[[], str]:
    """Get a function that generates random email addresses."""
    def _generate() -> str:
        return f"{uuid.uuid4()}@example.com"
    return _generate

@pytest.fixture
def random_uuid() -> Callable[[], str]:
    """Get a function that generates random UUIDs."""
    return lambda: str(uuid.uuid4())

@pytest.fixture
def json_serializer() -> Callable[[Any], str]:
    """Get a function that serializes objects to JSON."""
    def _serialize(obj: Any) -> str:
        if isinstance(obj, (datetime, Path)):
            return str(obj)
        return json.dumps(obj, default=str)
    return _serialize

@pytest.fixture
def timestamp_generator() -> Callable[[], str]:
    """Get a function that generates ISO format timestamps."""
    def _generate() -> str:
        return datetime.now(timezone.utc).isoformat()
    return _generate

@pytest.fixture
def temp_file_creator(tmp_path: Path) -> Callable[[str, str], Path]:
    """Get a function that creates temporary files."""
    def _create(filename: str, content: str = "") -> Path:
        file_path = tmp_path / filename
        file_path.write_text(content)
        return file_path
    return _create
