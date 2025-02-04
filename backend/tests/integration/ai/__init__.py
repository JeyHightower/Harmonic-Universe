"""AI test suite."""

import pytest
from typing import Dict

from app.models import AIModel, AIGeneration

# Register conftest.py for fixture sharing
pytest_plugins = ["tests.conftest"]

@pytest.fixture
def ai_test_data() -> Dict[str, str]:
    """Test data for AI endpoints."""
    return {
        "prompt": "Generate a test scene",
        "model_name": "test-model",
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 100,
            "top_p": 1.0
        }
    }
