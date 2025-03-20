from flask import Flask, jsonify
from flask_cors import CORS
import os
import time
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the blueprints
from api import auth_bp, api_bp
from app.api.routes.universe import universe_bp
from app.api.routes.scenes import scenes_bp
from app.api.routes.auth import auth_bp as auth_routes_bp

# Create Flask application
app = Flask(__name__, static_folder="static")
app.debug = True  # Enable debug mode

# Centralized CORS configuration
cors_config = {
    "origins": os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:5000,http://localhost:5001"
    ).split(","),
    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    "allow_headers": [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
    ],
    "expose_headers": ["Content-Length", "Content-Type"],
    "supports_credentials": True,
    "max_age": int(os.environ.get("CORS_MAX_AGE", "600")),  # 10 minutes
}

# Configure CORS with specific settings
CORS(
    app,
    resources={r"/*": cors_config},
)

# Configure app based on environment
app.config.from_mapping(
    SECRET_KEY=os.environ.get("SECRET_KEY", "dev-key-for-testing"),
    DATABASE_URI=os.environ.get("DATABASE_URL", "sqlite:///app.db"),
    # Add CORS configuration to app config for reference
    CORS_CONFIG=cors_config,
)

# Register basic blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(api_bp)

# Register CRUD routes
try:
    app.register_blueprint(universe_bp)
    print("Successfully registered Universe routes")
except Exception as e:
    print(f"Error registering Universe routes: {str(e)}")

try:
    app.register_blueprint(scenes_bp)
    print("Successfully registered Scene routes")
except Exception as e:
    print(f"Error registering Scene routes: {str(e)}")

try:
    app.register_blueprint(auth_routes_bp)
    print("Successfully registered Auth routes")
except Exception as e:
    print(f"Error registering Auth routes: {str(e)}")

# Root route for testing
@app.route('/')
def index():
    return jsonify({
        "message": "Welcome to Harmonic Universe API",
        "version": "1.0.0",
        "status": "running"
    })

# Health check route
@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": time.time()
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Not Found",
        "message": str(error)
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        "error": "Internal Server Error",
        "message": str(error)
    }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
