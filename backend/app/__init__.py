# app/__init__.py
from flask import Flask
from flask_migrate import Migrate
from .config import config
from .extensions import db, migrate, cors, csrf, cache, limiter
from .models import User, Universe, Storyboard, MusicParameter, PhysicsParameter, Version

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    csrf.init_app(app)
    cache.init_app(app)
    limiter.init_app(app)

    # Register blueprints
    from .routes import (
        auth_bp, music_bp, physics_bp, storyboard_bp, universe_bp, user_bp
    )
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(music_bp, url_prefix='/api/music')
    app.register_blueprint(physics_bp, url_prefix='/api/physics')
    app.register_blueprint(storyboard_bp, url_prefix='/api/storyboards')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(user_bp, url_prefix='/api/users')

    return app
