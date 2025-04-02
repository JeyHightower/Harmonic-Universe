from flask import Flask, Response, send_from_directory
import os
import sys
import logging

# Set up basic logging to console
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a bare minimum Flask application
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "static"), static_url_path="")

# Debug log to show the app is created
logger.info(f"Flask app created with name: {__name__}")
logger.info(f"Static folder: {app.static_folder}")
logger.info(f"Static folder exists: {os.path.exists(app.static_folder) if app.static_folder else False}")

@app.route('/minimal')
def minimal():
    """Absolute minimal route with no dependencies"""
    content = "Minimal test response from Harmonic Universe"
    logger.info(f"Serving minimal response: {len(content)} bytes")
    
    # Create response directly with explicit headers
    response = Response(
        content,
        status=200,
        mimetype='text/plain'
    )
    
    # Force content length
    response.headers['Content-Length'] = str(len(content))
    # Disable caching
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    logger.info(f"Response headers: {dict(response.headers)}")
    return response

@app.route('/')
def index():
    """Simplified root handler"""
    logger.info("Root path requested")
    content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Minimal Harmonic Universe</title>
    </head>
    <body>
        <h1>Minimal Harmonic Universe</h1>
        <p>This is a minimal test page to debug deployment issues.</p>
        <p>Try the <a href="/minimal">minimal text endpoint</a> if this page doesn't display properly.</p>
    </body>
    </html>
    """
    
    # Create response directly with explicit headers
    response = Response(
        content,
        status=200,
        mimetype='text/html'
    )
    
    # Force content length
    response.headers['Content-Length'] = str(len(content))
    # Disable caching
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    logger.info(f"Created index response with {len(content)} bytes")
    logger.info(f"Response headers: {dict(response.headers)}")
    
    return response

@app.route('/static-file')
def static_file():
    """Serve a static file using direct methods"""
    logger.info("Static file endpoint requested")
    
    # Check if we have a static folder
    if not app.static_folder or not os.path.exists(app.static_folder):
        logger.error(f"Static folder not found: {app.static_folder}")
        return "Static folder not found", 404
    
    # Try to serve test.html if it exists
    test_path = os.path.join(app.static_folder, 'test.html')
    if os.path.exists(test_path):
        try:
            with open(test_path, 'r') as f:
                content = f.read()
            
            logger.info(f"Read test.html: {len(content)} bytes")
            
            # Create response directly
            response = Response(
                content,
                status=200,
                mimetype='text/html'
            )
            response.headers['Content-Length'] = str(len(content))
            return response
        except Exception as e:
            logger.error(f"Error reading test.html: {str(e)}")
    else:
        logger.info(f"test.html not found, generating fallback")
    
    # If we don't have test.html, generate content
    content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Static File Test</title>
    </head>
    <body>
        <h1>Static File Test</h1>
        <p>This is a generated file because test.html was not found.</p>
        <p>Static folder: {}</p>
        <p>Static folder exists: {}</p>
    </body>
    </html>
    """.format(
        app.static_folder,
        os.path.exists(app.static_folder) if app.static_folder else False
    )
    
    response = Response(
        content,
        status=200,
        mimetype='text/html'
    )
    response.headers['Content-Length'] = str(len(content))
    
    logger.info(f"Generated static file response: {len(content)} bytes")
    return response

# Function for factory pattern if that's what Gunicorn expects
def create_app():
    """Factory function in case Gunicorn is looking for create_app pattern"""
    logger.info("create_app factory function called")
    return app

# Only for development - not used on Render
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)