#!/usr/bin/env python
"""
HTML Fallback Script for Flask Application

This script adds direct HTML response routes to the application,
ensuring that HTML content is served correctly even if the static
file serving mechanism is not working properly.
"""
import os
import logging
from flask import Flask, Response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_html_fallback_routes(app):
    """
    Add fallback routes to serve HTML content directly.

    Args:
        app: The Flask application instance
    """
    logger.info("Adding HTML fallback routes to the application")

    # Define the direct HTML route
    @app.route('/direct-html', endpoint='direct_html_fallback')
    def direct_html():
        """Serve a minimal HTML page directly from the route handler."""
        html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe - Direct HTML</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
            color: white;
            height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .button-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .button-primary {
            background-color: #4CAF50;
            color: white;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe - Direct HTML</h1>
        <p>This page is served directly from a Flask route handler, bypassing static file serving.</p>
        <div class="button-container">
            <a href="/" class="button button-primary">Home</a>
            <a href="/api/health" class="button button-primary">Health Check</a>
        </div>
    </div>
</body>
</html>"""

        # Create a response with proper content length and type
        response = Response(
            response=html_content,
            status=200,
            mimetype='text/html'
        )
        response.headers['Content-Length'] = str(len(html_content))
        logger.info(f"Serving direct HTML response ({len(html_content)} bytes)")
        return response

    # Add an alternative home route that doesn't rely on file reading
    original_home_route = None
    for rule in app.url_map.iter_rules():
        if rule.rule == '/' and rule.endpoint != 'home_fallback':
            original_home_route = rule.endpoint
            break

    if original_home_route:
        logger.info(f"Found original home route: {original_home_route}")

        @app.route('/', endpoint='home_fallback')
        def home_fallback():
            """Fallback handler for the home route."""
            try:
                # Try the original route first
                logger.info("Trying original home route")
                original_view_func = app.view_functions[original_home_route]
                response = original_view_func()

                # Check if the response has content
                if hasattr(response, 'data') and response.data:
                    logger.info(f"Original home route returned content ({len(response.data)} bytes)")
                    return response

                # If we get here, the original route returned an empty response
                logger.warning("Original home route returned empty content, using fallback")
                return serve_fallback_html()
            except Exception as e:
                logger.error(f"Error in original home route: {e}")
                return serve_fallback_html()
    else:
        logger.warning("No original home route found, adding fallback")

        @app.route('/', endpoint='home_fallback')
        def home_fallback():
            """Fallback handler for the home route."""
            return serve_fallback_html()

    def serve_fallback_html():
        """Serve a minimal fallback HTML page."""
        html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe - Fallback</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
            color: white;
            height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .button-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .button-primary {
            background-color: #4CAF50;
            color: white;
        }
        .button-secondary {
            background-color: #2196F3;
            color: white;
        }
        .button-tertiary {
            background-color: #FFC107;
            color: black;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .loading {
            display: none;
            margin-top: 1rem;
        }
        .loading.active {
            display: block;
        }
        .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Harmonic Universe</h1>
        <p>Explore the fascinating connection between music and physics.</p>
        <div class="button-container">
            <a href="/login" class="button button-primary">Login</a>
            <a href="/register" class="button button-secondary">Sign Up</a>
            <button id="demo-button" class="button button-tertiary">Try Demo</button>
        </div>
        <div style="margin-top: 2rem">
            <a href="/api/health" class="button button-primary">Health Check</a>
            <a href="/direct-html" class="button button-secondary">Direct HTML</a>
        </div>
        <div id="loading" class="loading">
            <p>Logging in as demo user...</p>
            <div class="spinner"></div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const demoButton = document.getElementById('demo-button');
            const loadingElement = document.getElementById('loading');

            demoButton.addEventListener('click', async function(e) {
                e.preventDefault();

                // Show loading indicator
                loadingElement.classList.add('active');
                demoButton.disabled = true;

                try {
                    // Make API request to demo login endpoint
                    const response = await fetch('/api/auth/demo-login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();

                        // Store tokens in localStorage
                        if (data.token) {
                            localStorage.setItem('accessToken', data.token);
                        }
                        if (data.refresh_token) {
                            localStorage.setItem('refreshToken', data.refresh_token);
                        }

                        // Redirect to dashboard
                        window.location.href = '/dashboard';
                    } else {
                        console.error('Demo login failed:', response.statusText);
                        alert('Demo login failed. Please try again.');
                        loadingElement.classList.remove('active');
                        demoButton.disabled = false;
                    }
                } catch (error) {
                    console.error('Error during demo login:', error);
                    alert('An error occurred during demo login. Please try again.');
                    loadingElement.classList.remove('active');
                    demoButton.disabled = false;
                }
            });
        });
    </script>
</body>
</html>"""

        # Create a response with proper content length and type
        response = Response(
            response=html_content,
            status=200,
            mimetype='text/html'
        )
        response.headers['Content-Length'] = str(len(html_content))
        logger.info(f"Serving fallback HTML response ({len(html_content)} bytes)")
        return response

    # Add routes for login, signup, and demo
    for route in ['/login', '/register', '/signup', '/demo']:
        endpoint = f'fallback_{route[1:]}'
        @app.route(route, endpoint=endpoint)
        def route_fallback():
            """Fallback handler for routes."""
            return serve_fallback_html()

    logger.info("HTML fallback routes added successfully")
    return app

if __name__ == "__main__":
    # This script can be run directly for testing
    from flask import Flask
    app = Flask(__name__)
    app = add_html_fallback_routes(app)
    app.run(debug=True, port=8080)
