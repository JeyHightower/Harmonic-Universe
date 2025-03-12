"""
WSGI entry point for the Harmonic Universe API
"""

from simple_app import app as application

# Alias for gunicorn - this solves the "Failed to find attribute 'app' in 'wsgi'" error
app = application

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=5001, debug=True)
