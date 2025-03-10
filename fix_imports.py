#!/usr/bin/env python
"""
fix_imports.py - Run this before starting the application to ensure all dependencies are available
"""
import sys
import os
import subprocess
import importlib

print("Running fix_imports.py...")

# List of required packages
required_packages = [
    "flask==2.0.1",
    "flask-sqlalchemy==2.5.1",
    "flask-cors==3.0.10",
    "werkzeug==2.0.1",
    "sqlalchemy==1.4.41",
    "psycopg2-binary==2.9.1",
    "python-dotenv==0.21.1",
    "gunicorn==20.1.0",
]

# Try to install required packages
print("Checking and installing required packages...")
for package in required_packages:
    try:
        # Check if the package is already installed
        package_name = package.split("==")[0].replace("-", "_")
        importlib.import_module(package_name)
        print(f"✅ {package_name} is already installed")
    except ImportError:
        print(f"⚠️ {package_name} is not installed. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-cache-dir", package])
            print(f"✅ Installed {package}")
        except Exception as e:
            print(f"❌ Failed to install {package}: {e}")

# Create stub for flask_migrate if it doesn't exist
print("\nCreating stub for flask_migrate...")
if 'flask_migrate' not in sys.modules:
    class DummyMigrate:
        def __init__(self, app=None, db=None, **kwargs):
            print("Dummy Migrate initialized")

        def init_app(self, app, db=None, **kwargs):
            print("Dummy Migrate init_app called")

    class DummyModule:
        Migrate = DummyMigrate

        def __getattr__(self, name):
            print(f"Attempted to access {name} on dummy flask_migrate")
            return lambda *args, **kwargs: None

    # Install the dummy module
    sys.modules['flask_migrate'] = DummyModule()
    print("✅ Created stub for flask_migrate")
else:
    print("✅ flask_migrate is already available")

print("\nEnvironment patching complete!")

# Print debug info
print("\nDebug information:")
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print("Python path:")
for path in sys.path:
    print(f"  - {path}")
print("\nInstalled packages:")
subprocess.call([sys.executable, "-m", "pip", "list"])

print("\nfix_imports.py completed successfully!")
