"""Flask application factory."""
from flask import Flask, jsonify
from flask_cors import CORS
from .config import config_by_name
from .extensions import socketio, db, migrate, jwt, limiter
from .sockets.physics_handler import PhysicsNamespace

def create_app(config_name='development', testing=False):
    """Create Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])
    app.config['TESTING'] = testing

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    # Initialize SocketIO with correct settings
    socketio.init_app(app,
                     message_queue=app.config.get('SOCKETIO_MESSAGE_QUEUE'),
                     async_mode='eventlet' if not testing else None,
                     cors_allowed_origins="*")

    # Register namespaces
    physics_namespace = PhysicsNamespace('/physics')
    socketio.on_namespace(physics_namespace)

    with app.app_context():
        # Import parts of our application
        from .routes import register_routes
        register_routes(app)

        # Create tables if they don't exist
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
