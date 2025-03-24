from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize SQLAlchemy
db = SQLAlchemy()

# Create Flask application
app = Flask(__name__, static_folder="static")

# Configure CORS
CORS(app)

# Configure app
app.config.from_mapping(
    SQLALCHEMY_TRACK_MODIFICATIONS=False
)

# Load environment variables
if os.path.exists('.env'):
    from dotenv import load_dotenv
    load_dotenv()

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

# Health check route
@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "version": "1.0.0"
    }), 200

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
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
