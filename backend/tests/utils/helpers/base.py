"""Test utilities and helper functions."""

import os
import json
from pathlib import Path
from typing import Any, Dict, Optional, Union
from datetime import datetime, timedelta

import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.models import User
from tests.factories import UserFactory

def create_test_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a test JWT token."""
    return create_access_token(user_id, expires_delta)

def verify_test_token(token: str) -> Dict[str, Any]:
    """Verify a test JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

def create_test_file(directory: Union[str, Path], filename: str, content: bytes) -> Path:
    """Create a test file with given content."""
    file_path = Path(directory) / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)
    return file_path

def create_test_json_file(directory: Union[str, Path], filename: str, data: Dict[str, Any]) -> Path:
    """Create a test JSON file with given data."""
    file_path = Path(directory) / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(json.dumps(data, indent=2))
    return file_path

def cleanup_test_files(*paths: Union[str, Path]) -> None:
    """Clean up test files."""
    for path in paths:
        path = Path(path)
        if path.is_file():
            path.unlink()
        elif path.is_dir():
            for file in path.glob("*"):
                file.unlink()
            path.rmdir()

def create_test_user_with_permissions(
    db: Session,
    permissions: Dict[str, bool],
    **kwargs: Any
) -> User:
    """Create a test user with specific permissions."""
    user = UserFactory(db=db, **kwargs)
    for permission, value in permissions.items():
        setattr(user, f"can_{permission}", value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_test_file_path(filename: str) -> Path:
    """Get the path to a test file in the fixtures directory."""
    return Path(__file__).parent / "fixtures" / filename

def load_test_json(filename: str) -> Dict[str, Any]:
    """Load a JSON test fixture."""
    file_path = get_test_file_path(filename)
    return json.loads(file_path.read_text())

def save_test_json(data: Dict[str, Any], filename: str) -> None:
    """Save data as a JSON test fixture."""
    file_path = get_test_file_path(filename)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(json.dumps(data, indent=2))

class TestingSessionManager:
    """Context manager for handling test database sessions."""

    def __init__(self, session: Session):
        self.session = session

    def __enter__(self) -> Session:
        return self.session

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()
