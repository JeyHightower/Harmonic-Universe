"""
Verify that the Flask app can be properly imported and initialized.
This helps debug deployment issues.
"""
import sys
import os

def verify_app():
    """Try to import and initialize the Flask app to verify it works."""
    print("Verifying Flask app can be imported...")
    print(f"Current directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")

    try:
        from backend.app import create_app
        print("✅ Successfully imported create_app function")

        from backend.app.core.config import config
        print("✅ Successfully imported config")

        app = create_app(config['production'])
        print("✅ Successfully created Flask app")

        print("App routes:")
        for rule in app.url_map.iter_rules():
            print(f"  {rule.endpoint}: {rule.rule}")

        print("App is ready to be served by gunicorn!")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("This usually means the app module can't be found in PYTHONPATH")
        print("Make sure the PYTHONPATH environment variable includes the directory containing the app module")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = verify_app()
    sys.exit(0 if success else 1)
