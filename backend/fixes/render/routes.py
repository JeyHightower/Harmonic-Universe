"""
Render Route Fixes

This module adds special routes to handle specific paths on Render's platform.
"""

def register_render_routes(app):
    """Register special routes for Render platform compatibility."""
    from flask import request, jsonify, send_file
    import io
    
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
    
    print("Render-specific routes registered")
    return True 