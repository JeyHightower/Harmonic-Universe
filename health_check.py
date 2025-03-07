#!/usr/bin/env python
"""
Standalone health check module for Harmonic Universe
This provides a simple health check endpoint that can be used by Render
"""
import os
import sys
import logging
from datetime import datetime
from flask import Flask, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("health_check")

# Create a minimal Flask app just for health checks
health_app = Flask(__name__)

@health_app.route('/health')
@health_app.route('/api/health')
def health():
    """Health check endpoint that returns 200 OK"""
    logger.info("Health check endpoint called")
    try:
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'message': 'Harmonic Universe API is running',
            'static_folder': health_app.static_folder,
            'environment': os.environ.get('FLASK_ENV', 'unknown')
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@health_app.route('/')
def root():
    """Serves a simple HTML page to verify static files"""
    try:
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Harmonic Universe Health Check</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #333; }
                .status { margin-top: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
                .healthy { color: green; }
                .unhealthy { color: red; }
            </style>
        </head>
        <body>
            <h1>Harmonic Universe</h1>
            <p>Health Check Service</p>
            <div class="status">
                <p class="healthy">Status: Healthy</p>
                <p>Timestamp: %s</p>
            </div>
        </body>
        </html>
        """ % datetime.now().isoformat()
    except Exception as e:
        logger.error(f"Root endpoint failed: {e}")
        return f"Error: {e}", 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    logger.info(f"Starting health check server on port {port}")
    health_app.run(host='0.0.0.0', port=port, debug=False)
