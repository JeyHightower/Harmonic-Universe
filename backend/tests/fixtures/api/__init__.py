"""API test fixtures."""

# Import all fixtures from this directory
from pathlib import Path
import importlib

# Get all Python files in this directory
fixtures_dir = Path(__file__).parent
for file in fixtures_dir.glob("*.py"):
    if file.stem != "__init__":
        module = importlib.import_module(f".{file.stem}", __package__)
        # Import all names that don't start with _
        names = [name for name in dir(module) if not name.startswith("_")]
        globals().update({name: getattr(module, name) for name in names})
