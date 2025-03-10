#!/usr/bin/env python
"""
Minimal health check server that always responds with a 200 OK.
This is a separate script that can be run as a fallback if the main application fails.
"""
import os
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HealthCheckHandler(BaseHTTPRequestHandler):
    """Simple HTTP handler that returns 200 OK for all requests."""

    def _set_headers(self):
        """Set headers for all responses."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        logger.info(f"Received GET request at path: {self.path}")
        self._set_headers()

        # Response depends on path
        if self.path == '/health':
            self.wfile.write(b'{"status":"ok","message":"Health check server is running"}')
        else:
            # Serve static index.html for other paths
            static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
            index_path = os.path.join(static_dir, 'index.html')

            try:
                if os.path.exists(index_path):
                    with open(index_path, 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    self.wfile.write(b'<html><body><h1>Harmonic Universe</h1><p>Static file not found.</p></body></html>')
            except Exception as e:
                logger.error(f"Error serving static file: {e}")
                self.wfile.write(b'<html><body><h1>Harmonic Universe</h1><p>Error serving static file.</p></body></html>')

def run(server_class=HTTPServer, handler_class=HealthCheckHandler, port=10000):
    """Run the health check server."""
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logger.info(f'Starting simple health check server on port {port}...')
    httpd.serve_forever()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 10000))
    run(port=port)
