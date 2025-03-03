"""Test the health check endpoint."""
import pytest
import requests


def test_health_endpoint():
    """Test that the health check endpoint returns 200."""
    response = requests.get("http://localhost:8000/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
