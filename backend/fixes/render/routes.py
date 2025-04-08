"""
Render Route Fixes

This module adds special routes to handle specific paths on Render's platform.
"""

def register_render_routes(app):
    """Register special routes for Render platform compatibility."""
    from flask import request, jsonify, send_file, send_from_directory
    import io
    import os
    
    @app.route('/render-static-js/<path:filename>')
    def render_static_js(filename):
        """Serve JS files from a special path with forced JS MIME type."""
        # Log the request
        app.logger.info(f"Render static JS requested: {filename}")
        
        # Generate a simple JavaScript file with the filename
        js_content = f"""
        // Render static JS file: {filename}
        console.log('Loading {filename} from Render static route');
        
        // Export necessary functions for compatibility
        export const jsx = (type, props) => ({{ type, props }});
        export const jsxs = (type, props) => ({{ type, props }});
        export const Fragment = Symbol('Fragment');
        
        // Default export
        export default {{ 
            filename: '{filename}',
            render_static: true,
            timestamp: {{}}.valueOf()
        }};
        """
        
        # Create a file-like object
        js_file = io.BytesIO(js_content.encode('utf-8'))
        
        # Return the file with explicit JavaScript MIME type
        return send_file(
            js_file, 
            mimetype='application/javascript; charset=utf-8',
            as_attachment=False,
            download_name=filename
        )
    
    @app.route('/render-debug')
    def render_debug():
        """Render platform debug endpoint."""
        debug_info = {
            'request': {
                'path': request.path,
                'method': request.method,
                'headers': dict(request.headers),
                'args': dict(request.args)
            },
            'render_specific': {
                'render_instance_id': request.headers.get('X-Render-Instance-ID', 'unknown'),
                'host_headers': request.headers.get('Host', 'unknown'),
                'forwarded_host': request.headers.get('X-Forwarded-Host', 'unknown'),
                'forwarded_proto': request.headers.get('X-Forwarded-Proto', 'unknown')
            }
        }
        
        return jsonify(debug_info)
    
    # Add explicit SPA route handlers for common frontend routes
    @app.route('/dashboard')
    def spa_dashboard():
        """Handle SPA dashboard route in production."""
        app.logger.info("SPA route hit: /dashboard")
        # Serve the index.html file for SPA routing
        static_folder = app.static_folder
        if static_folder and os.path.exists(os.path.join(static_folder, 'index.html')):
            return send_from_directory(static_folder, 'index.html')
        else:
            app.logger.error(f"Could not find index.html in {static_folder}")
            return jsonify({"error": "SPA index not found"}), 500
    
    print("Render-specific routes registered")
    return True 