"""
Simplified app.py that redirects to the main app in app/__init__.py.
This file exists only for backward compatibility with existing code that imports from here.
"""

from app import create_app

# This is what Gunicorn will import
application = create_app()
app = application

if __name__ == "__main__":
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)