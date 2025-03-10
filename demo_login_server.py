#!/usr/bin/env python
"""
Simple standalone demo login server.
This is a minimal Flask application that only handles demo login requests.
"""
from flask import Flask, jsonify, request
import datetime
import jwt
import logging
import sys
import os

# Setup logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Get CORS settings from environment variables
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# Enable CORS for all routes with more secure configuration
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')

    # Check if the request origin is allowed
    if origin and any(origin == allowed_origin for allowed_origin in cors_origins):
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization,X-Requested-With,Accept')
        response.headers.add('Access-Control-Allow-Methods',
                             'GET,POST,PUT,DELETE,PATCH,OPTIONS')
        response.headers.add('Access-Control-Expose-Headers',
                             'Content-Length,Content-Type')
        response.headers.add('Access-Control-Max-Age', '600')  # 10 minutes

    return response

@app.route('/api/auth/demo-login', methods=['POST', 'OPTIONS'])
def demo_login():
    """Demo login endpoint"""
    if request.method == 'OPTIONS':
        logger.info("OPTIONS request to demo login endpoint")
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 204

    logger.info("Demo login endpoint called with POST")

    try:
        # Create a simple demo token
        logger.info("Creating demo token")

        # Use a simple string as the secret key
        secret_key = "demo_secret_key_for_testing_only"

        payload = {
            'user_id': 'demo123',
            'username': 'demo_user',
            'email': 'demo@example.com',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }

        logger.info(f"Token payload: {payload}")

        token = jwt.encode(payload, secret_key, algorithm='HS256')
        logger.info("Token created successfully")

        # Convert bytes to string if needed
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            logger.info("Converted token from bytes to string")

        logger.info("Demo login successful")

        response_data = {
            'message': 'Demo login successful',
            'token': token,
            'access_token': token,
            'refresh_token': token,
            'user': {
                'id': 'demo123',
                'username': 'demo_user',
                'email': 'demo@example.com'
            }
        }

        logger.info(f"Returning response: {response_data}")
        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error in demo login: {str(e)}", exc_info=True)
        return jsonify({'message': 'An error occurred during demo login', 'error': str(e)}), 500

# Add a route for the API v1 endpoint to support both paths
@app.route('/api/v1/auth/demo-login', methods=['POST', 'OPTIONS'])
def demo_login_v1():
    """Demo login endpoint (API v1 path)"""
    logger.info("API v1 demo login endpoint called, forwarding to main demo login handler")
    return demo_login()

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    logger.info("Starting demo login server on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
