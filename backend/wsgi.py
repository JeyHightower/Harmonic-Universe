import sys
import os
import time
import logging

# Configure basic logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("wsgi")

def log_env(environ):
    """Log key environment variables"""
    logger.info("===== WSGI ENVIRONMENT =====")
    for key in sorted(environ.keys()):
        if key.startswith('HTTP_') or key in ('REQUEST_METHOD', 'PATH_INFO', 'QUERY_STRING', 'CONTENT_TYPE', 'CONTENT_LENGTH', 'SERVER_NAME', 'SERVER_PORT'):
            logger.info(f"{key}: {environ[key]}")
    logger.info("============================")

def application(environ, start_response):
    """
    Ultra-minimal WSGI application with no dependencies.
    """
    logger.info(f"Request received: {environ.get('REQUEST_METHOD')} {environ.get('PATH_INFO')}")
    log_env(environ)
    
    # Extract path
    path = environ.get('PATH_INFO', '').lstrip('/')
    
    # Generate different responses based on path
    if path == '':
        logger.info("Serving root path")
        status = '200 OK'
        response_headers = [('Content-type', 'text/html')]
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ultra-minimal WSGI App</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
                .container {{ max-width: 800px; margin: 0 auto; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Ultra-minimal WSGI App</h1>
                <p>This is a bare-bones WSGI application with no dependencies.</p>
                <p>Server time: {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p>Python version: {sys.version}</p>
                <p>Try these endpoints:</p>
                <ul>
                    <li><a href="/plain">Plain text response</a></li>
                    <li><a href="/debug">Debug info</a></li>
                </ul>
            </div>
        </body>
        </html>
        """.encode('utf-8')
        
    elif path == 'plain':
        logger.info("Serving plain text response")
        status = '200 OK'
        response_headers = [('Content-type', 'text/plain')]
        body = f"Hello from Harmonic Universe! Server time: {time.strftime('%Y-%m-%d %H:%M:%S')}".encode('utf-8')
        
    elif path == 'debug':
        logger.info("Serving debug info")
        status = '200 OK'
        response_headers = [('Content-type', 'text/plain')]
        
        # Gather system info
        debug_info = [
            f"Server time: {time.strftime('%Y-%m-%d %H:%M:%S')}",
            f"Python version: {sys.version}",
            f"Working directory: {os.getcwd()}",
            f"PATH environment: {os.environ.get('PATH', 'Not set')}",
            f"PORT environment: {os.environ.get('PORT', 'Not set')}",
            "\nDirectory contents:",
        ]
        
        # Add directory contents
        try:
            for item in os.listdir('.'):
                item_path = os.path.join('.', item)
                if os.path.isdir(item_path):
                    debug_info.append(f"  DIR: {item}")
                else:
                    size = os.path.getsize(item_path)
                    debug_info.append(f"  FILE: {item} ({size} bytes)")
        except Exception as e:
            debug_info.append(f"Error listing directory: {str(e)}")
        
        body = '\n'.join(debug_info).encode('utf-8')
    else:
        logger.info(f"Path not found: {path}")
        status = '404 Not Found'
        response_headers = [('Content-type', 'text/plain')]
        body = f"404 Not Found: {path}".encode('utf-8')
    
    # Add content length header
    content_length = len(body)
    response_headers.append(('Content-Length', str(content_length)))
    
    # Add cache prevention headers
    response_headers.extend([
        ('Cache-Control', 'no-cache, no-store, must-revalidate'),
        ('Pragma', 'no-cache'),
        ('Expires', '0')
    ])
    
    logger.info(f"Sending response: {status}, {content_length} bytes")
    logger.info(f"Response headers: {response_headers}")
    
    start_response(status, response_headers)
    return [body]

# For direct execution during testing
if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    port = int(os.environ.get('PORT', 8000))
    httpd = make_server('', port, application)
    print(f"Serving on port {port}...")
    httpd.serve_forever() 