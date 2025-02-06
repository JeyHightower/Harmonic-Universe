"""Integration test fixtures."""

# Import all fixtures from this directory and subdirectories
from pathlib import Path
import importlib

# Import fixtures from this directory
fixtures_dir = Path(__file__).parent
for file in fixtures_dir.glob("*.py"):
    if file.stem != "__init__":
        module = importlib.import_module(f".{file.stem}", __package__)
        # Import all names that don't start with _
        names = [name for name in dir(module) if not name.startswith("_")]
        globals().update({name: getattr(module, name) for name in names})

# Import fixtures from subdirectories
for subdir in fixtures_dir.glob("*/"):
    if subdir.is_dir() and not subdir.name.startswith("__"):
        # Create the package import path
        package_path = f".{subdir.name}"
        try:
            module = importlib.import_module(package_path, __package__)
            # Import all names that don't start with _
            names = [name for name in dir(module) if not name.startswith("_")]
            globals().update({name: getattr(module, name) for name in names})
        except ImportError:
            continue
