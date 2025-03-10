import os
import logging
import sys
from flask import Flask, send_from_directory, request, jsonify

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

application = Flask(__name__)

# Load the HTML fallback script
try:
    from html_fallback import add_html_fallback_routes
    logger.info("Loading HTML fallback routes")
    application = add_html_fallback_routes(application)
    logger.info("HTML fallback routes loaded successfully")
except Exception as e:
    logger.error(f"Failed to load HTML fallback routes: {e}")

# Fix the response middleware
@application.after_request
def add_content_length(response):
    try:
        # Skip direct passthrough mode responses
        if response.direct_passthrough:
            logger.info("Skipping content-length for direct passthrough response")
            return response

        # Only attempt to add content length for regular responses
        if hasattr(response, 'data') and response.data:
            logger.info(f"Response data length: {len(response.data)}")
            response.headers['Content-Length'] = str(len(response.data))

        return response
    except Exception as e:
        logger.error(f"Error in response middleware: {str(e)}")
        return response  # Ensure the response is returned even on error

# Serve static files
@application.route('/static/<path:filename>')
def serve_static_file(filename):
    logger.info(f"Explicitly serving static file: {filename}")
    try:
        # Try both the app's static folder and the root static folder
        for static_dir in [application.static_folder, os.path.join(os.getcwd(), 'static')]:
            file_path = os.path.join(static_dir, filename)
            if os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()

                # Determine content type based on file extension
                content_type = 'application/octet-stream'  # Default
                if filename.endswith('.html'):
                    content_type = 'text/html'
                elif filename.endswith('.css'):
                    content_type = 'text/css'
                elif filename.endswith('.js'):
                    content_type = 'application/javascript'
                elif filename.endswith('.png'):
                    content_type = 'image/png'
                elif filename.endswith('.jpg') or filename.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                elif filename.endswith('.svg'):
                    content_type = 'image/svg+xml'

                response = application.response_class(
                    response=content,
                    status=200,
                    mimetype=content_type
                )
                response.headers['Content-Length'] = str(len(content))
                logger.info(f"Successfully served static file: {filename} ({len(content)} bytes)")
                return response

        # If we get here, the file wasn't found
        logger.warning(f"Static file not found: {filename}")
        return jsonify({"error": f"File not found: {filename}"}), 404
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        return jsonify({"error": str(e)}), 500

# Run app directly if script is executed
if __name__ == "__main__":
    application.run(debug=True)
