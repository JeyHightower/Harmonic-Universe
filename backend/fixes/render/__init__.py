"""
Render-specific fixes package

This package contains modules and utilities for fixing Render-specific deployment issues.
"""

from ..mime_override import apply_all_mime_fixes
from .routes import register_render_routes

def apply_render_fixes(app):
    """Apply all Render-specific fixes to the Flask app."""
    # Apply MIME type fixes
    apply_all_mime_fixes(app)
    
    # Register special routes
    register_render_routes(app)
    
    return app 