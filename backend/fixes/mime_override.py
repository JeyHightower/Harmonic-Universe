"""
MIME Type Override for Flask

This module patches Flask to ensure correct MIME types for static files.
It provides two approaches:
1. Direct patching of Flask's send_file and send_from_directory functions
2. WSGI middleware for handling MIME types at the response level
"""
import mimetypes
import os
import re
import functools
from functools import wraps
from flask import send_file, send_from_directory
import flask


# Ensure proper MIME types are registered
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/javascript', '.jsx')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')


def patched_send_file(path_or_file, *args, **kwargs):
    """Patched version of Flask's send_file function to ensure proper MIME types."""
    # Check if this is a JavaScript file and ALWAYS set mimetype regardless of whether it was provided
    if isinstance(path_or_file, str) and path_or_file.endswith(('.js', '.mjs', '.jsx')):
        kwargs['mimetype'] = 'application/javascript'
    elif isinstance(path_or_file, str) and path_or_file.endswith('.css'):
        kwargs['mimetype'] = 'text/css'
    elif isinstance(path_or_file, str) and path_or_file.endswith('.svg'):
        kwargs['mimetype'] = 'image/svg+xml'
    elif isinstance(path_or_file, str) and path_or_file.endswith('.json'):
        kwargs['mimetype'] = 'application/json'
    
    return send_file(path_or_file, *args, **kwargs)


def patched_send_from_directory(directory, filename, *args, **kwargs):
    """Patched version of Flask's send_from_directory function to ensure proper MIME types."""
    # Check if this is a JavaScript file and ALWAYS set mimetype regardless of whether it was provided
    if filename.endswith(('.js', '.mjs', '.jsx')):
        kwargs['mimetype'] = 'application/javascript'
    elif filename.endswith('.css'):
        kwargs['mimetype'] = 'text/css'
    elif filename.endswith('.svg'):
        kwargs['mimetype'] = 'image/svg+xml'
    elif filename.endswith('.json'):
        kwargs['mimetype'] = 'application/json'
    
    return send_from_directory(directory, filename, *args, **kwargs)


def apply_mime_overrides():
    """Apply Flask function-level MIME type overrides."""
    # Patch Flask's send_file and send_from_directory at the module level
    flask.send_file = patched_send_file
    flask.send_from_directory = patched_send_from_directory
    
    print("MIME type overrides applied to Flask")


def create_mime_middleware(app):
    """Create WSGI middleware to handle MIME types at the response level."""
    original_wsgi_app = app.wsgi_app
    
    @wraps(original_wsgi_app)
    def mime_type_middleware(environ, start_response):
        # Original response function
        original_start_response = start_response
        
        # Intercept the response headers
        def new_start_response(status, headers, exc_info=None):
            # Get the path from the environ
            path = environ.get('PATH_INFO', '')
            
            # Check if this is a JavaScript file
            if re.search(r'\.(js|mjs|jsx)$', path) or '/src/index.js' in path or '/jsx-runtime' in path:
                # Replace Content-Type header or add it if not present
                new_headers = []
                content_type_added = False
                
                for name, value in headers:
                    if name.lower() == 'content-type':
                        new_headers.append(('Content-Type', 'application/javascript; charset=utf-8'))
                        content_type_added = True
                    else:
                        new_headers.append((name, value))
                
                if not content_type_added:
                    new_headers.append(('Content-Type', 'application/javascript; charset=utf-8'))
                
                # Add CORS headers for JavaScript
                new_headers.append(('Access-Control-Allow-Origin', '*'))
                new_headers.append(('Access-Control-Allow-Methods', 'GET, OPTIONS'))
                
                return original_start_response(status, new_headers, exc_info)
            
            # For non-JS files, just pass through
            return original_start_response(status, headers, exc_info)
        
        # Call the original app with our modified start_response
        return original_wsgi_app(environ, new_start_response)
    
    # Replace the WSGI app with our middleware
    app.wsgi_app = mime_type_middleware
    
    print("MIME type middleware applied at WSGI level")
    return app


def apply_all_mime_fixes(app):
    """Apply all MIME type fixes to the Flask app."""
    # Apply function-level patches
    apply_mime_overrides()
    
    # Apply WSGI middleware
    create_mime_middleware(app)
    
    print("All MIME type fixes applied")
    return app 