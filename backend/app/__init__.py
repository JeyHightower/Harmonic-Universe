from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from .extensions import db, limiter
from datetime import timedelta
import os

def create_app(test_config=None):
    app = Flask(__name__)

    if test_config is None:
        app.config.from_object('app.config.Config')
    else:
        app.config.update(test_config)

    # Initialize CORS with more permissive settings
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://localhost:5177",
                "http://localhost:5178",
                "http://localhost:5179",
                "http://localhost:5180",
                "http://localhost:5181",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "http://127.0.0.1:5176",
                "http://127.0.0.1:5177",
                "http://127.0.0.1:5178",
                "http://127.0.0.1:5179",
                "http://127.0.0.1:5180",
                "http://127.0.0.1:5181"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
            "supports_credentials": True,
            "expose_headers": ["Content-Range", "X-Content-Range"]
        }
    })

    # Initialize database
    db.init_app(app)
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Database initialization error: {e}")

    # Initialize JWT
    jwt = JWTManager(app)

    # Initialize migrations
    Migrate(app, db)

    # Initialize rate limiter
    limiter.init_app(app)

    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

    # Register blueprints
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy'}, 200

    return app
