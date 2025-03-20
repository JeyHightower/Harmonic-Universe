#!/usr/bin/env python
"""
WSGI entry point for Gunicorn.
This file imports and exposes the Flask application using the standard pattern.
"""
import os
import logging
import time
import mimetypes
from flask import request, jsonify, Response, send_from_directory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure mime types are correctly registered
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')
mimetypes.add_type('application/json', '.json')

# Import the Flask application
from app import app as application

# Load the HTML fallback script
try:
    from html_fallback import add_html_fallback_routes
    logger.info("Loading HTML fallback routes")
    application = add_html_fallback_routes(application)
    logger.info("HTML fallback routes loaded successfully")
except Exception as e:
    logger.error(f"Failed to load HTML fallback routes: {e}")

# Content-Length middleware for all responses
@application.after_request
def add_content_length(response):
    """Ensure Content-Length and proper MIME types for all responses."""
    try:
        # Skip direct passthrough responses
        if response.direct_passthrough:
            logger.info("Skipping content-length for direct passthrough response")
            return response

        # Add Content-Length header for standard responses with data
        if hasattr(response, 'data') and response.data:
            content_length = len(response.data)
            logger.info(f"Setting Content-Length: {content_length}")
            response.headers['Content-Length'] = str(content_length)

            # Ensure JavaScript files have the correct Content-Type
            if request.path.endswith('.js'):
                response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
            elif request.path.endswith('.css'):
                response.headers['Content-Type'] = 'text/css; charset=utf-8'
            elif request.path.endswith('.html'):
                response.headers['Content-Type'] = 'text/html; charset=utf-8'

        return response
    except Exception as e:
        logger.error(f"Error in content-length middleware: {str(e)}")
        return response  # Return the original response on error

# Request logger
@application.before_request
def log_request():
    """Log details about incoming requests."""
    logger.info(f"Request: {request.method} {request.path} "
                f"headers={dict(request.headers)}")
    # Store start time for response timing
    request.start_time = time.time()

# Response time logger
@application.after_request
def log_response_time(response):
    """Log the time taken to process the request."""
    if hasattr(request, 'start_time'):
        response_time = time.time() - request.start_time
        logger.info(f"Response: {response.status_code} in {response_time:.4f}s")
    return response

# Helper to determine content type from file extension
def get_content_type(filename):
    """Get MIME type for file based on extension."""
    content_type, encoding = mimetypes.guess_type(filename)
    if not content_type:
        # Fallback for common file types
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.js':
            content_type = 'application/javascript'
        elif ext == '.css':
            content_type = 'text/css'
        elif ext == '.html':
            content_type = 'text/html'
        elif ext == '.json':
            content_type = 'application/json'
        elif ext in ['.jpg', '.jpeg']:
            content_type = 'image/jpeg'
        elif ext == '.png':
            content_type = 'image/png'
        elif ext == '.svg':
            content_type = 'image/svg+xml'
        elif ext == '.ico':
            content_type = 'image/x-icon'
        else:
            content_type = 'application/octet-stream'

    return content_type

# Static file serving route
@application.route('/static/<path:filename>')
def serve_static_file(filename):
    """Serve static files with proper headers and content types."""
    logger.info(f"Serving static file: {filename}")
    try:
        # Look in multiple static directories
        static_dirs = [
            application.static_folder,
            os.path.join(os.getcwd(), 'static'),
            os.path.join(os.getcwd(), 'dist'),
            os.path.join(os.getcwd(), 'build')
        ]

        for static_dir in static_dirs:
            if not static_dir or not os.path.exists(static_dir):
                continue

            file_path = os.path.join(static_dir, filename)
            if os.path.isfile(file_path):
                # Get file info
                content_type = get_content_type(filename)
                file_size = os.path.getsize(file_path)

                logger.info(f"Found static file at {file_path}, size: {file_size}, type: {content_type}")

                # Read file content
                with open(file_path, 'rb') as f:
                    content = f.read()

                # Create response with comprehensive headers
                headers = {
                    'Content-Length': str(file_size),
                    'Content-Type': content_type,
                    'Cache-Control': 'public, max-age=31536000',  # Cache for 1 year
                    'X-Content-Type-Options': 'nosniff'  # Security: prevent content type sniffing
                }

                # Special handling for JavaScript files
                if filename.endswith('.js'):
                    headers['Content-Type'] = 'application/javascript; charset=utf-8'
                elif filename.endswith('.css'):
                    headers['Content-Type'] = 'text/css; charset=utf-8'
                elif filename.endswith('.html'):
                    headers['Content-Type'] = 'text/html; charset=utf-8'
                    # Don't cache HTML files for as long
                    headers['Cache-Control'] = 'public, max-age=3600'

                response = Response(
                    content,
                    mimetype=content_type,
                    headers=headers
                )

                logger.info(f"Successfully serving static file: {filename} ({file_size} bytes)")
                return response

        # File not found in any location
        logger.warning(f"Static file not found: {filename}")
        return jsonify({
            "error": f"File not found: {filename}",
            "paths_checked": [d for d in static_dirs if d and os.path.exists(d)]
        }), 404, {'Content-Type': 'application/json'}

    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500, {'Content-Type': 'application/json'}

# Root route to serve index.html
@application.route('/')
def serve_index():
    """Serve the main index.html file with appropriate headers."""
    logger.info("Serving root index.html")

    # Check multiple locations for index.html
    possible_paths = [
        os.path.join(os.getcwd(), 'static', 'index.html'),
        os.path.join(os.getcwd(), 'dist', 'index.html'),
        os.path.join(os.getcwd(), 'build', 'index.html')
    ]

    for index_path in possible_paths:
        if os.path.isfile(index_path):
            logger.info(f"Serving root index.html from {index_path}")

            try:
                # Get file size for Content-Length
                file_size = os.path.getsize(index_path)

                # Read the file
                with open(index_path, 'rb') as f:
                    content = f.read()

                # Create response with appropriate caching headers
                response = Response(
                    content,
                    mimetype='text/html',
                    headers={
                        'Content-Length': str(file_size),
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'X-Content-Type-Options': 'nosniff'
                    }
                )

                return response

            except Exception as e:
                logger.error(f"Error reading index.html: {e}")

    # No index.html found
    logger.error("index.html not found in any static directory")
    return "App Error: index.html not found", 500

# Catch-all route for SPA client-side routing
@application.route('/<path:path>')
def catch_all(path):
    """Serve index.html for any non-static routes for single-page app support."""
    # Skip API routes
    if path.startswith('api/') or path.startswith('static/'):
        return jsonify({"error": "Not found"}), 404

    logger.info(f"Path {path} not matched, serving index.html for client-side routing")
    return serve_index()

# Run the app if script is executed directly
if __name__ == "__main__":
    application.run()
