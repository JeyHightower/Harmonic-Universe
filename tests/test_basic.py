import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

print('sys.path:', sys.path)

from backend.app.main import app

def test_app_configuration():
    """Test that the application is configured correctly."""
    assert app.title == "Harmonic Universe API"
    assert app.version == "0.1.0"
