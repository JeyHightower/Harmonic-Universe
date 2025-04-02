# Re-export everything from backend.app
try:
    from backend.app import *
    print("Successfully re-exported from backend.app")
except ImportError as e:
    print(f"Warning: Could not import from backend.app: {e}")
    try:
        # Alternative: try to import specific components
        try:
            from backend.app import app
            print("Successfully imported app from backend.app")
        except ImportError:
            pass
            
        try:
            from backend.app import create_app
            print("Successfully imported create_app from backend.app")
        except ImportError:
            pass
    except Exception as e:
        print(f"Error attempting to import specific components: {e}")

# Print a message to indicate this file was loaded
print("Root app.py module loaded") 