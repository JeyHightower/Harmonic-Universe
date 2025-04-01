"""
MIME Type Override for Flask

This module patches Flask's send_file and send_from_directory functions
to ensure JavaScript files are served with the correct MIME type.
"""
import mimetypes
import os
import functools
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
    # Check if this is a JavaScript file and set mimetype if not provided
    if isinstance(path_or_file, str) and path_or_file.endswith(('.js', '.mjs', '.jsx')) and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'application/javascript'
    elif isinstance(path_or_file, str) and path_or_file.endswith('.css') and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'text/css'
    elif isinstance(path_or_file, str) and path_or_file.endswith('.svg') and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'image/svg+xml'
    elif isinstance(path_or_file, str) and path_or_file.endswith('.json') and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'application/json'
    
    return send_file(path_or_file, *args, **kwargs)


def patched_send_from_directory(directory, filename, *args, **kwargs):
    """Patched version of Flask's send_from_directory function to ensure proper MIME types."""
    # Check if this is a JavaScript file and set mimetype if not provided
    if filename.endswith(('.js', '.mjs', '.jsx')) and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'application/javascript'
    elif filename.endswith('.css') and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'text/css'
    elif filename.endswith('.svg') and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'image/svg+xml'
    elif filename.endswith('.json') and 'mimetype' not in kwargs:
        kwargs['mimetype'] = 'application/json'
    
    return send_from_directory(directory, filename, *args, **kwargs)


def apply_mime_overrides():
    """Apply all MIME type overrides."""
    # Patch Flask's send_file and send_from_directory at the module level
    flask.send_file = patched_send_file
    flask.send_from_directory = patched_send_from_directory
    
    print("MIME type overrides applied to Flask") 