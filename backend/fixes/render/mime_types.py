"""
Render MIME Type Fixes

This module provides fixes for MIME type issues specific to Render.
It works by patching response headers at the WSGI level.
"""

import mimetypes
import re
from functools import wraps

def apply_mime_fixes(app):
    """Apply Render-specific MIME type fixes to the Flask app."""
    # Ensure all JavaScript MIME types are registered
    mimetypes.add_type('application/javascript', '.js')
    mimetypes.add_type('application/javascript', '.mjs')
    mimetypes.add_type('application/javascript', '.jsx')
    
    # Create WSGI middleware to handle MIME types
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
    
    print("Render MIME type fixes applied at WSGI level")
    return True 