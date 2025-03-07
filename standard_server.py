#!/usr/bin/env python3
"""
Ultra-minimal web server using only Python standard library.
Designed to handle health checks and serve static files without any dependencies.
"""
import os
import sys
import socket
import time
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("standard_server")

# Constants
PORT = int(os.environ.get('PORT', 10000))
STATIC_DIR = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')

class SimpleHandler(BaseHTTPRequestHandler):
    """Simple HTTP request handler with no external dependencies."""

    def log_message(self, format, *args):
        """Override to use our logger instead of stderr."""
        logger.info("%s - - [%s] %s" %
                     (self.address_string(),
                      self.log_date_time_string(),
                      format % args))

    def send_response_only(self, code, message=None):
        """Send the response code only."""
        self.log_request(code)
        self.send_response_code(code, message)

    def serve_static_file(self, path):
        """Serve a static file."""
        if path == '/' or not path:
            path = 'index.html'

        # Strip leading slash
        if path.startswith('/'):
            path = path[1:]

        file_path = os.path.join(STATIC_DIR, path)

        # Security check - prevent directory traversal
        if not os.path.abspath(file_path).startswith(os.path.abspath(STATIC_DIR)):
            self.send_error(403, "Forbidden")
            return

        try:
            if os.path.exists(file_path) and os.path.isfile(file_path):
                # Determine content type
                if file_path.endswith('.html'):
                    content_type = 'text/html'
                elif file_path.endswith('.css'):
                    content_type = 'text/css'
                elif file_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif file_path.endswith('.png'):
                    content_type = 'image/png'
                elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                else:
                    content_type = 'application/octet-stream'

                # Read the file
                with open(file_path, 'rb') as f:
                    content = f.read()

                # Send headers
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()

                # Send content
                self.wfile.write(content)
            else:
                # Try to serve index.html
                index_path = os.path.join(STATIC_DIR, 'index.html')
                if os.path.exists(index_path) and os.path.isfile(index_path):
                    # Read the file
                    with open(index_path, 'rb') as f:
                        content = f.read()

                    # Send headers
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()

                    # Send content
                    self.wfile.write(content)
                else:
                    # Send a basic HTML response
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.end_headers()

                    # Basic HTML
                    html = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Harmonic Universe</title>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body>
                        <h1>Harmonic Universe</h1>
                        <p>File not found: {path}</p>
                        <p>Fallback page displayed.</p>
                    </body>
                    </html>
                    """.encode('utf-8')

                    self.wfile.write(html)
        except Exception as e:
            logger.error(f"Error serving static file {file_path}: {e}")
            self.send_error(500, f"Internal Server Error: {str(e)}")

    def serve_json(self, data, status=200):
        """Serve JSON data."""
        json_str = "{"
        for i, (k, v) in enumerate(data.items()):
            if i > 0:
                json_str += ", "
            if isinstance(v, str):
                json_str += f'"{k}": "{v}"'
            elif isinstance(v, (int, float, bool)):
                json_str += f'"{k}": {v}'
            elif v is None:
                json_str += f'"{k}": null'
            else:
                json_str += f'"{k}": "{str(v)}"'
        json_str += "}"

        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(json_str)))
        self.end_headers()
        self.wfile.write(json_str.encode('utf-8'))

    def do_GET(self):
        """Handle GET requests."""
        try:
            logger.info(f"GET request,\nPath: {self.path}\nHeaders:\n{self.headers}")
            parsed_path = urlparse(self.path)
            path = parsed_path.path

            # Health check endpoints
            if path == '/health' or path == '/api/health':
                logger.info("Health check endpoint called")
                self.serve_json({
                    'status': 'ok',
                    'message': 'Health check passed',
                    'server_time': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()),
                    'python_version': sys.version,
                    'static_dir': STATIC_DIR
                })
            else:
                # Serve static files for all other paths
                self.serve_static_file(path)

        except Exception as e:
            logger.error(f"Error handling GET request: {e}")
            self.send_error(500, f"Internal Server Error: {str(e)}")


def ensure_static_files():
    """Ensure that static directory exists and contains an index.html file."""
    try:
        # Create static directory if it doesn't exist
        if not os.path.exists(STATIC_DIR):
            os.makedirs(STATIC_DIR, exist_ok=True)
            logger.info(f"Created static directory: {STATIC_DIR}")

        # Set permissions
        os.chmod(STATIC_DIR, 0o755)
        logger.info(f"Set permissions on static directory: {STATIC_DIR}")

        # Create index.html if it doesn't exist
        index_path = os.path.join(STATIC_DIR, 'index.html')
        if not os.path.exists(index_path):
            with open(index_path, 'w') as f:
                f.write("""<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Application is running!</p>
    <p>Static files are being served correctly.</p>
    <p>Server time: """ + time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()) + """</p>
  </div>
</body>
</html>""")
            logger.info(f"Created index.html: {index_path}")

        # Set permissions
        os.chmod(index_path, 0o644)
        logger.info(f"Set permissions on index.html: {index_path}")

        return True
    except Exception as e:
        logger.error(f"Error ensuring static files: {e}")
        return False


def main():
    """Run the server."""
    # Log system information
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Starting server on port {PORT}")
    logger.info(f"Using static directory: {STATIC_DIR}")

    # Ensure static files
    ensure_static_files()

    # Try to create server on all addresses
    try:
        server_address = ('', PORT)
        httpd = HTTPServer(server_address, SimpleHandler)
        logger.info(f'Starting HTTP server on port {PORT}...')
        httpd.serve_forever()
    except Exception as e:
        logger.error(f"Error starting server on all addresses: {e}")

        # Try localhost only as fallback
        try:
            server_address = ('127.0.0.1', PORT)
            httpd = HTTPServer(server_address, SimpleHandler)
            logger.info(f'Starting HTTP server on localhost:{PORT}...')
            httpd.serve_forever()
        except Exception as e2:
            logger.error(f"Error starting server on localhost: {e2}")

            # Try a different port as a last resort
            try:
                alt_port = PORT + 1000  # Try PORT+1000
                server_address = ('', alt_port)
                httpd = HTTPServer(server_address, SimpleHandler)
                logger.info(f'Starting HTTP server on alternate port {alt_port}...')
                httpd.serve_forever()
            except Exception as e3:
                logger.error(f"Failed to start server on any port: {e3}")
                sys.exit(1)


if __name__ == "__main__":
    main()
