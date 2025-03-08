#!/usr/bin/env python
"""
Emergency fallback script to ensure HTML content is served correctly.
This script patches the application to include a direct HTML response.
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("html_fallback")

def add_direct_html_routes(app):
    """
    Adds direct HTML response routes to the application.
    This ensures HTML content is served even if file reading fails.
    """
    logger.info("Adding direct HTML routes to application")

    # Add direct response always available
    @app.route('/direct-html')
    def direct_html():
        """Serve a direct HTML response without file reading."""
        html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe platform. The application is running in direct HTML mode.</p>
        <p>This is a creative platform for music and physics visualization.</p>
        <div>
            <a href="/api/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
        </div>
    </div>
</body>
</html>"""

        # Explicitly set content type and return response with content length
        response = app.response_class(
            response=html,
            status=200,
            mimetype='text/html',
            headers={
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': str(len(html))
            }
        )
        logger.info(f"Serving direct HTML response ({len(html)} bytes)")
        return response

    # Save any original home route if it exists
    original_home = None
    if hasattr(app, 'view_functions') and 'home' in app.view_functions:
        logger.info("Saving original home route")
        original_home = app.view_functions['home']

    # Add our own reliable home route
    @app.route('/', endpoint='direct_home')
    def direct_home():
        """Alternative direct home route that doesn't rely on file reading."""
        try:
            # First try the original route if it exists
            if original_home:
                logger.info("Trying original home route")
                try:
                    result = original_home()
                    if result and hasattr(result, 'data') and len(result.data) > 100:
                        logger.info(f"Original home route succeeded ({len(result.data)} bytes)")

                        # Ensure Content-Length header is set
                        if 'Content-Length' not in result.headers:
                            logger.info(f"Adding Content-Length header: {len(result.data)}")
                            result.headers['Content-Length'] = str(len(result.data))

                        return result
                    else:
                        logger.warning(f"Original home route returned insufficient content: {result}")
                except Exception as e:
                    logger.warning(f"Original home route failed: {e}")

            # If original route failed or doesn't exist, use direct HTML
            logger.info("Using direct HTML for home route")
            html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe platform. The application is running successfully!</p>
        <p>This is a creative platform for music and physics visualization.</p>
        <div>
            <a href="/api/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
            <a href="/direct-html" class="button">Direct HTML</a>
        </div>
    </div>
</body>
</html>"""

            # Explicitly set content type and return response with content length
            response = app.response_class(
                response=html,
                status=200,
                mimetype='text/html',
                headers={
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Length': str(len(html))
                }
            )
            logger.info(f"Serving direct HTML home response ({len(html)} bytes)")
            return response
        except Exception as e:
            logger.exception(f"Error in direct home route: {e}")
            # Ultra minimal fallback with explicit content-length
            emergency_html = """
            <html><body><h1>Harmonic Universe</h1><p>Emergency fallback page</p></body></html>
            """
            return app.response_class(
                response=emergency_html,
                status=200,
                mimetype='text/html',
                headers={
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Length': str(len(emergency_html))
                }
            )

    # Add a response middleware to ensure content-length is always set
    @app.after_request
    def ensure_html_response_headers(response):
        """Ensure HTML responses have proper headers including Content-Length."""
        if response.mimetype == 'text/html' and response.data:
            # Make sure Content-Length is set
            if 'Content-Length' not in response.headers:
                response.headers['Content-Length'] = str(len(response.data))
                logger.info(f"Added Content-Length header: {len(response.data)}")

            # Make sure Content-Type includes charset
            if 'Content-Type' in response.headers and 'charset' not in response.headers['Content-Type']:
                response.headers['Content-Type'] = 'text/html; charset=utf-8'
                logger.info("Fixed Content-Type header to include charset")

        return response

    logger.info("Successfully added direct HTML routes to application")
    return True

if __name__ == "__main__":
    logger.info("Running HTML fallback script directly")
    try:
        # Try to import the Flask application
        from app.wsgi import application, app
        add_direct_html_routes(application)
        logger.info("Successfully patched application")

        # Special testing for middleware
        logger.info("Testing response middleware")
        try:
            from flask import Flask
            test_app = Flask(__name__)
            add_direct_html_routes(test_app)
            with test_app.test_request_context('/'):
                resp = test_app.make_response("<html><body>Test</body></html>")
                resp.mimetype = 'text/html'
                processed = ensure_html_response_headers(resp)
                logger.info(f"Middleware test response headers: {dict(processed.headers)}")
        except Exception as test_e:
            logger.warning(f"Middleware test failed: {test_e}")

    except Exception as e:
        logger.error(f"Failed to patch application: {e}")
        sys.exit(1)
