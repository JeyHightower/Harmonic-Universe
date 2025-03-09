from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os

def create_app(test_config=None):
    """Create and configure the Flask application"""
    app = Flask(__name__, static_folder='static')

    # Get CORS settings from environment variables
    cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

    # Configure CORS with specific settings
    CORS(app,
         resources={r"/*": {
             "origins": cors_origins,
             "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
             "expose_headers": ["Content-Length", "Content-Type"],
             "supports_credentials": True,
             "max_age": 600  # 10 minutes
         }}
    )

    # Configure app based on environment
    if test_config is None:
        # Load production configuration
        app.config.from_mapping(
            SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key-for-testing'),
            DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db')
        )
    else:
        # Load test configuration
        app.config.from_mapping(test_config)

    # Add health check endpoints
    @app.route('/health')
    @app.route('/api/health')
    @app.route('/healthcheck')
    @app.route('/api/healthcheck')
    @app.route('/ping')
    @app.route('/api/ping')
    @app.route('/status')
    @app.route('/api/status')
    def health_check():
        return jsonify({"status": "healthy"}), 200

    # Serve static files
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_static(path):
        if path != "" and os.path.exists(os.path.join('static', path)):
            return send_from_directory('static', path)
        else:
            return send_from_directory('static', 'index.html')

    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=True)
