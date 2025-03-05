"""
Flask middleware to patch Ant Icons JavaScript files on-the-fly
to ensure React.createContext is available.
"""
import os
import logging
from flask import request, Response, current_app

# Set up logging
logger = logging.getLogger(__name__)

# The patch to apply to Ant Icons JavaScript files
REACT_CONTEXT_PATCH = """
// Direct patch for React.createContext
if (typeof React === 'undefined' || !React.createContext) {
  var React = React || {};
  React.createContext = function(defaultValue) {
    return {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children(defaultValue); },
      _currentValue: defaultValue
    };
  };
}

// Ensure IconContext is defined even if React.createContext fails
var ensureIconContext = function() {
  try {
    return React.createContext({});
  } catch (e) {
    console.warn('[DirectPatch] Error creating IconContext:', e);
    return {
      Provider: function(props) { return props.children; },
      Consumer: function(props) { return props.children({}); }
    };
  }
};

// Create a local reference to IconContext
var IconContext = ensureIconContext();

"""

def init_app(app):
    """
    Initialize the Flask app with the patching middleware
    """
    logger.info("Initializing React.createContext patching middleware")

    # Add the middleware to patch JavaScript files
    @app.after_request
    def patch_javascript_response(response):
        """
        Patch JavaScript responses to ensure React.createContext is available
        """
        # Only patch JavaScript files that might be related to Ant Icons
        if (response.mimetype == 'application/javascript' or
            response.mimetype == 'text/javascript') and (
            'ant-icons' in request.path or
            '@ant-design/icons' in request.path):

            logger.debug(f"Checking JavaScript file for patching: {request.path}")

            # Check if the file is already patched
            if b'// Direct patch for React.createContext' not in response.data:
                logger.info(f"Patching JavaScript file: {request.path}")

                # Apply the patch to the JavaScript content
                patched_content = REACT_CONTEXT_PATCH + response.data.decode('utf-8')

                # Create a new response with the patched content
                response = Response(
                    patched_content,
                    status=response.status_code,
                    headers=dict(response.headers)
                )
                response.headers['Content-Type'] = 'application/javascript'

        return response

    # Add a context processor to include React polyfill in all templates
    @app.context_processor
    def inject_react_polyfill():
        """
        Inject the React polyfill into all templates
        """
        return {
            'react_polyfill': True,
            'react_polyfill_url': '/react-polyfill.js'
        }

    logger.info("React patching middleware initialized")
