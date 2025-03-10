"""
Patch for app initialization to disable migrations when FLASK_NO_MIGRATE is set.

HOW TO USE THIS PATCH:
1. Look for your app initialization code (likely in app.py, __init__.py, or similar)
2. Find where Flask-Migrate is initialized (look for "Migrate(app, db)" or similar)
3. Replace that code with the pattern shown below
"""

# Original code might look like:
# migrate = Migrate(app, db)

# Replace with this pattern:
import os
from flask_migrate import Migrate

# Initialize Flask-Migrate conditionally
if os.environ.get('FLASK_NO_MIGRATE') != 'true':
    migrate = Migrate(app, db)
    print("Database migrations enabled")
else:
    # Skip migrations completely
    print("Database migrations disabled by FLASK_NO_MIGRATE")

# If you have any code that runs migrations automatically, wrap it like this:
if os.environ.get('SKIP_DB_UPGRADE') != 'true':
    # Run migrations
    with app.app_context():
        try:
            from flask_migrate import upgrade as _upgrade
            _upgrade()
            print("Database migrations applied")
        except Exception as e:
            print(f"Error applying migrations: {e}")
else:
    print("Automatic migrations disabled by SKIP_DB_UPGRADE")
