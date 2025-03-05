"""
Main application module.
"""

import os
from flask import Flask, jsonify
from backend.app import create_app
from backend.app.core.config import settings
from backend.app.core.errors import AppError

# Create Flask app
app = create_app()

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
    # Check if running on Render.com
    if os.environ.get("RENDER"):
        from backend.app.core.render_config import configure_for_render
        render_config = configure_for_render(app)
        app.run(**render_config)
    else:
        app.run(host="0.0.0.0", port=8000)
