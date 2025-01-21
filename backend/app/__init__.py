"""Flask application factory."""
from flask import Flask
from flask_cors import CORS
from .config import config
from .extensions import socketio, db, migrate, jwt, limiter
from .sockets.physics_handler import PhysicsNamespace
from .routes.analytics_routes import analytics_bp

def create_app(config_name='development', testing=False):
    """Create Flask application."""
    app = Flask(__name__)

    # Configure the app
    app.config.from_object(config[config_name])
    if testing:
        app.config['TESTING'] = True

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Set up WebSocket namespaces
    physics_namespace = PhysicsNamespace('/physics')
    socketio.on_namespace(physics_namespace)

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.universe import universe_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(universe_bp)
    app.register_blueprint(analytics_bp)

    with app.app_context():
        if not testing:
            db.create_all()

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404

    @app.errorhandler(500)
    def server_error(error):
        return {'error': 'Internal server error'}, 500

    @app.errorhandler(429)
    def ratelimit_handler(error):
        return {'error': 'Rate limit exceeded'}, 429

    return app
