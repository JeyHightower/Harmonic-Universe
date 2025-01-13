# app/__init__.py
from flask import Flask
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from .config import Config
from app.models import db

# Setup Database
migrate = Migrate()
csrf = CSRFProtect()

def create_app():
    app = Flask(__name__)

    # Load Configurations
    app.config.from_object(Config)

    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)

    # Initialize models
    with app.app_context():
        db.create_all()

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.music_routes import music_bp
    from .routes.physics_routes import physics_bp
    from .routes.storyboard_routes import storyboard_bp
    from .routes.universe_routes import universe_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(music_bp)
    app.register_blueprint(physics_bp)
    app.register_blueprint(storyboard_bp)
    app.register_blueprint(universe_bp, url_prefix='/universes')

    return app
