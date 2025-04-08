"""
Render-specific fixes package

This package contains modules and utilities for fixing Render-specific deployment issues.
"""

import logging
from ..mime_override import apply_all_mime_fixes
from .routes import register_render_routes

def apply_render_fixes(app):
    """Apply all Render-specific fixes to the Flask app."""
    logger = logging.getLogger(__name__)
    logger.info("Applying Render-specific fixes...")
    
    # Apply MIME type fixes
    apply_all_mime_fixes(app)
    
    # Register special routes
    result = register_render_routes(app)
    logger.info(f"Render routes registered: {result}")
    
    # Log that fixes were applied
    logger.info("All Render-specific fixes applied successfully")
    
    return app 