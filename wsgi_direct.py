#!/usr/bin/env python
"""
Direct WSGI entry point for Gunicorn.
This file creates and configures the Flask app directly to avoid module loading issues.
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("wsgi_direct")

try:
    # Import create_app from app module
    logger.info("Importing from app module")
    from app import create_app

    # Create and configure the Flask application
    logger.info("Creating Flask application")
    application = create_app()

    # Add middleware to ensure Content-Length is set
    @application.after_request
    def ensure_content_length(response):
        """Ensure Content-Length header is set for all responses."""
        if hasattr(response, 'data') and response.data and 'Content-Length' not in response.headers:
            response.headers['Content-Length'] = str(len(response.data))
            logger.info(f"Setting Content-Length: {len(response.data)} bytes")
        return response

    # Add debug route to check app status
    @application.route('/app-status')
    def app_status():
        """Return status of the application."""
        routes = sorted([str(rule) for rule in application.url_map.iter_rules()])
        return {
            "status": "healthy",
            "app_name": application.name,
            "static_folder": application.static_folder,
            "routes": routes,
            "environment": os.environ.get('FLASK_ENV', 'production')
        }

    logger.info(f"Flask application '{application.name}' initialized with static folder: {application.static_folder}")

except Exception as e:
    logger.exception(f"Error creating Flask application: {e}")
    # Create a minimal application as a fallback
    from flask import Flask, Response
    application = Flask(__name__)

    @application.route('/')
    def home():
        """Fallback home route."""
        html = """<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe - Emergency Fallback</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            text-align: center;
            background: rgba(0,0,0,0.2);
            padding: 2rem;
            border-radius: 12px;
            backdrop-filter: blur(8px);
        }
        h1 { margin-bottom: 1rem; }
        .error { color: #ffcccc; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running in emergency fallback mode.</p>
        <p class="error">The main application failed to initialize.</p>
        <p>Please check server logs for details.</p>
    </div>
</body>
</html>"""

        response = Response(
            html,
            status=200,
            mimetype='text/html',
            headers={
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': str(len(html))
            }
        )
        return response

    @application.route('/api/health')
    def health():
        """Simple health check endpoint."""
        return {"status": "degraded", "message": "Running in fallback mode"}

    logger.info("Fallback Flask application initialized")

# This allows direct execution of the file
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Running application directly on port {port}")
    application.run(host="0.0.0.0", port=port)
