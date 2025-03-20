from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import time
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize SQLAlchemy
db = SQLAlchemy()

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
    SQLALCHEMY_DATABASE_URI=os.environ.get("DATABASE_URL", "sqlite:///app.db"),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    # Add CORS configuration to app config for reference
    CORS_CONFIG=cors_config,
)

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)

# Import models (after db initialization)
from app.api.models import Character, Note

# Import routes (after model imports)
from app.api.routes.characters import characters_bp
from app.api.routes.notes import notes_bp

# Register blueprints
app.register_blueprint(characters_bp)
app.register_blueprint(notes_bp)

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
