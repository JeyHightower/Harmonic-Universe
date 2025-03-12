"""
WSGI entry point for the Harmonic Universe API
"""

from simple_app import app as application

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=5001, debug=True)
