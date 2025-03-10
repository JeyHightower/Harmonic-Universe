#!/usr/bin/env python
"""
Patch the Flask application to ensure proper HTML responses.
This script can be called directly to patch the Flask app before the server starts.
"""
import os
import sys
import logging
import importlib.util

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("patch_flask_app")

def load_flask_app():
    """Try to load the Flask application from different possible locations."""
    app = None
    # Try different module names and attributes
    modules_to_try = [
        ('app.wsgi', ['application', 'app']),
        ('wsgi', ['application', 'app']),
        ('app', ['app', 'application', 'create_app'])
    ]

    for module_name, attrs in modules_to_try:
        try:
            logger.info(f"Trying to import from {module_name}")
            module = importlib.import_module(module_name)

            for attr in attrs:
                if hasattr(module, attr):
                    logger.info(f"Found {attr} in {module_name}")
                    obj = getattr(module, attr)

                    # If it's a function (like create_app), call it
                    if callable(obj) and attr == 'create_app':
                        logger.info("Calling create_app function")
                        app = obj()
                        return app
                    else:
                        return obj
        except Exception as e:
            logger.warning(f"Error importing {module_name}: {e}")

    logger.error("Could not load Flask application from any known location")
    return None

def patch_flask_app(app):
    """
    Patch the Flask application to ensure proper HTML responses.
    This adds middleware and routes to handle HTML content properly.
    """
    from flask import Flask, Response

    if not isinstance(app, Flask):
        logger.error(f"Object is not a Flask application: {type(app)}")
        return False

    logger.info(f"Patching Flask application: {app.name}")

    # Add direct HTML route if it doesn't exist
    if '/direct-html' not in [rule.rule for rule in app.url_map.iter_rules()]:
        @app.route('/direct-html')
        def direct_html():
            """Serve a direct HTML response."""
            html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .button {
            display: inline-block;
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
            color: white;
            text-decoration: none;
            padding: 0.8rem 1.8rem;
            border-radius: 30px;
            font-weight: bold;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Direct HTML response from patched Flask application.</p>
        <div>
            <a href="/api/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
        </div>
    </div>
</body>
</html>"""

            # Explicitly set content type and content length
            response = Response(
                html,
                status=200,
                mimetype='text/html',
                headers={
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Length': str(len(html))
                }
            )
            logger.info(f"Serving direct HTML response ({len(html)} bytes)")
            return response

    # Add a custom exception handler for all exceptions
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.exception(f"Unhandled exception: {e}")
        error_html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Error - Harmonic Universe</title>
    <style>
        body {{ font-family: sans-serif; margin: 40px; line-height: 1.6; }}
        .error-container {{
            max-width: 800px;
            margin: 0 auto;
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            border-left: 5px solid #dc3545;
        }}
        h1 {{ color: #dc3545; }}
        .back-link {{
            display: inline-block;
            margin-top: 20px;
            background-color: #0d6efd;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Application Error</h1>
        <p>We encountered an error processing your request.</p>
        <p>Error: {str(e)}</p>
        <a href="/" class="back-link">Return to Home</a>
    </div>
</body>
</html>"""

        # Ensure proper content type and length
        response = Response(
            error_html,
            status=500,
            mimetype='text/html',
            headers={
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': str(len(error_html))
            }
        )
        return response

    # Add a response middleware to ensure content-length is always set
    @app.after_request
    def ensure_html_response_headers(response):
        """Ensure HTML responses have proper headers."""
        if response.mimetype == 'text/html' and response.data:
            # Make sure Content-Length is set
            if 'Content-Length' not in response.headers:
                response.headers['Content-Length'] = str(len(response.data))
                logger.info(f"Added Content-Length header: {len(response.data)}")

            # Make sure Content-Type includes charset
            if 'Content-Type' in response.headers and 'charset' not in response.headers['Content-Type']:
                response.headers['Content-Type'] = 'text/html; charset=utf-8'
                logger.info("Fixed Content-Type header to include charset")

        logger.debug(f"Response headers: {dict(response.headers)}")
        return response

    # Add debug request middleware
    @app.before_request
    def log_request_details():
        """Log request details for debugging."""
        from flask import request
        logger.info(f"Request: {request.method} {request.path}")
        logger.debug(f"Request headers: {dict(request.headers)}")

    logger.info("Successfully patched Flask application")
    return True

def main():
    """Main function to patch the Flask application."""
    logger.info("Starting Flask application patching")

    # Load the Flask application
    app = load_flask_app()
    if not app:
        logger.error("Failed to load Flask application")
        sys.exit(1)

    # Patch the Flask application
    if not patch_flask_app(app):
        logger.error("Failed to patch Flask application")
        sys.exit(1)

    logger.info("Flask application patched successfully")
    return 0

if __name__ == "__main__":
    sys.exit(main())
