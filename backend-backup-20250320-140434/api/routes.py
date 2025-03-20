"""API routes."""

from flask import jsonify
import time

def register_routes(auth_bp, api_bp):
    """Register routes with blueprints."""

    @auth_bp.route('/demo-login', methods=['POST'])
    def demo_login():
        """Demo login endpoint."""
        return jsonify({
            'token': 'demo-token',
            'user': {
                'id': 1,
                'username': 'demo',
                'email': 'demo@example.com'
            }
        }), 200

    @api_bp.route('/health')
    def health_check():
        """Health check endpoint."""
        return jsonify({
            'status': 'healthy',
            'timestamp': int(time.time()),
            'version': '1.0.0'
        }), 200

    @api_bp.route('/test')
    def test():
        """Test endpoint."""
        return jsonify({
            'message': 'API is working'
        }), 200

    return auth_bp, api_bp
