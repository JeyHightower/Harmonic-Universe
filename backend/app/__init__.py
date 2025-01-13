# app/__init__.py
from flask import Flask, request
from flask_cors import CORS
from flask_session import Session
from config import Config
from app.extensions import db, migrate, cors, csrf

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    csrf.init_app(app)
    Session(app)

    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "X-CSRF-Token", "Authorization"],
            "expose_headers": ["X-CSRF-Token"],
            "supports_credentials": True
        }
    })

    # CSRF exemption for token auth
    @csrf.exempt
    def check_token_auth():
        auth_header = request.headers.get('Authorization')
        return auth_header and auth_header.startswith('Bearer ')

    # Exempt auth routes from CSRF
    csrf.exempt(r"/api/auth/*")

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.universe_routes import universe_bp
    from app.routes.music_routes import music_bp
    from app.routes.physics_routes import physics_bp
    from app.routes.storyboard_routes import storyboard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(music_bp, url_prefix='/api/universes')
    app.register_blueprint(physics_bp, url_prefix='/api/universes')
    app.register_blueprint(storyboard_bp, url_prefix='/api/universes')

    # CSRF token route
    @app.route('/api/csrf/token')
    def get_csrf_token():
        token = csrf.generate_csrf()
        response = {'csrf_token': token}
        return response

    # Error handlers
    @app.errorhandler(400)
    def handle_csrf_error(e):
        return {'error': 'CSRF token missing or invalid'}, 400

    @app.errorhandler(401)
    def handle_unauthorized(e):
        return {'error': 'Authentication required'}, 401

    @app.errorhandler(403)
    def handle_forbidden(e):
        return {'error': 'Forbidden'}, 403

    # Initialize models
    with app.app_context():
        from app.models import init_models
        db.create_all()
        init_models()

    return app
