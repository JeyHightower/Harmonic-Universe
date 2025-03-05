#!/usr/bin/env python3
"""
Verify that the Render.com setup is working correctly
This script checks that the application can be imported and instantiated
"""
import os
import sys
import traceback

# Get current directory and add to PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Print environment information
print("=== Harmonic Universe Render.com Setup Verification ===")
print(f"Current directory: {os.getcwd()}")
print(f"Python version: {sys.version}")
print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")
print(f"sys.path: {sys.path}\n")

success = True

# Test importing modules
print("=== Testing imports ===")

# Test importing from root app.py
try:
    print("Importing create_app from app...")
    from app import create_app
    print("✅ Successfully imported create_app from app")

    # Test creating app instance
    try:
        print("Creating app instance...")
        app = create_app()
        print("✅ Successfully created app instance")
    except Exception as e:
        success = False
        print(f"❌ Error creating app instance: {e}")
        print(traceback.format_exc())
except Exception as e:
    success = False
    print(f"❌ Import error from app: {e}")
    print(traceback.format_exc())

# Test importing from wsgi.py
try:
    print("\n=== Testing wsgi imports ===")
    print("Importing application from wsgi...")
    from wsgi import application
    print("✅ Successfully imported application from wsgi")
except Exception as e:
    success = False
    print(f"❌ Import error from wsgi: {e}")
    print(traceback.format_exc())

# Test importing from backend
try:
    print("\n=== Testing backend imports ===")
    print("Importing from backend.app...")
    from backend.app import create_app as backend_create_app
    print("✅ Successfully imported create_app from backend.app")

    # Test importing config
    try:
        print("Importing config from backend.app.core.config...")
        from backend.app.core.config import config
        print("✅ Successfully imported config")
    except Exception as e:
        success = False
        print(f"❌ Error importing config: {e}")
        print(traceback.format_exc())
except Exception as e:
    success = False
    print(f"❌ Import error from backend.app: {e}")
    print(traceback.format_exc())

print("\n=== Setup verification complete! ===")
if success:
    print("✅ All checks passed. Your application should work on Render.com!")
else:
    print("❌ Some checks failed. Please fix the errors above before deploying.")
