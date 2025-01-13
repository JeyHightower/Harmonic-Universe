# app/__init__.py
from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from .config import Config, TestConfig
from app.models import db

# Setup Database
migrate = Migrate()
csrf = CSRFProtect()

def create_app(config_name=None):
    app = Flask(__name__)

    # Load Configurations
    if config_name == 'testing':
        app.config.from_object(TestConfig)
    else:
        app.config.from_object(Config)

    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)

    # CSRF token route
    @app.route('/api/csrf/token', methods=['GET'])
    def get_csrf_token():
        token = csrf._get_token()
        return jsonify({'csrf_token': token})

    # Initialize models
    with app.app_context():
        db.create_all()

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.music_routes import music_bp
    from .routes.physics_routes import physics_bp
    from .routes.storyboard_routes import storyboard_bp
    from .routes.universe_routes import universe_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(music_bp, url_prefix='/api/music')
    app.register_blueprint(physics_bp, url_prefix='/api/physics')
    app.register_blueprint(storyboard_bp, url_prefix='/api/storyboards')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')

    return app
