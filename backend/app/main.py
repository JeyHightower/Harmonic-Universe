"""
Main application module.
"""

from flask import Flask, jsonify
from app import create_app
from app.core.config import settings
from app.core.errors import AppError

# Create Flask app
app = create_app()

@app.route("/health")
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    })

@app.errorhandler(AppError)
def handle_app_error(error: AppError):
    """Handle application-specific errors."""
    response = jsonify({
        "code": error.code,
        "message": error.message,
        "details": error.details
    })
    response.status_code = error.status_code
    return response

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
