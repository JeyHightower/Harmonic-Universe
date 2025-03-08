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

        # Explicitly set content type and return response
        response = app.response_class(
            response=html,
            status=200,
            mimetype='text/html'
        )
        logger.info("Serving direct HTML response")
        return response

    # Also patch the home route if it's not working
    original_home = None
    if hasattr(app, 'view_functions') and 'home' in app.view_functions:
        logger.info("Saving original home route")
        original_home = app.view_functions['home']

    @app.route('/', endpoint='direct_home')
    def direct_home():
        """Alternative direct home route that doesn't rely on file reading."""
        try:
            # First try the original route if it exists
            if original_home:
                logger.info("Trying original home route")
                try:
                    result = original_home()
                    if result and len(result) > 100:  # If it returns non-empty content
                        logger.info("Original home route succeeded")
                        return result
                except Exception as e:
                    logger.warning(f"Original home route failed: {e}")

            # If original route failed or doesn't exist, use direct HTML
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

            # Explicitly set content type and return response
            response = app.response_class(
                response=html,
                status=200,
                mimetype='text/html'
            )
            logger.info("Serving direct HTML home response")
            return response
        except Exception as e:
            logger.exception(f"Error in direct home route: {e}")
            # Ultra minimal fallback
            return """
            <html><body><h1>Harmonic Universe</h1><p>Emergency fallback page</p></body></html>
            """

    logger.info("Successfully added direct HTML routes to application")
    return True

if __name__ == "__main__":
    logger.info("Running HTML fallback script directly")
    try:
        # Try to import the Flask application
        from app.wsgi import application, app
        add_direct_html_routes(application)
        logger.info("Successfully patched application")
    except Exception as e:
        logger.error(f"Failed to patch application: {e}")
        sys.exit(1)
