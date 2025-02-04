"""API test suite for Harmonic Universe backend."""

# Import pytest for fixture discovery
import pytest
from fastapi.testclient import TestClient

from app.main import app

# Register conftest.py for fixture sharing
pytest_plugins = ["tests.conftest"]

client = TestClient(app)
