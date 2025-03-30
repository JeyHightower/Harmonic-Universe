from flask import Flask, jsonify, send_from_directory, Response
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
import os
from pathlib import Path
from typing import Optional, Union

from .api.database import db, migrate

def create_app():
    app = Flask(__name__)
    static_folder = str(Path(__file__).parent.parent / 'frontend' / 'dist')
    app.static_folder = static_folder
    app.static_url_path = ''
    
    # Get database URL from environment
    db_dir = os.path.dirname(os.path.dirname(__file__))
    os.makedirs(db_dir, exist_ok=True)
    database_url = 'sqlite:///' + os.path.abspath(os.path.join(db_dir, 'app.db'))
    print(f"Using SQLite database at: {database_url}")
    
    # Default configuration
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads'),
        MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB max file size
        RATELIMIT_STORAGE_URL=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
        RATELIMIT_STRATEGY="fixed-window",
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret'),
        JWT_ACCESS_TOKEN_EXPIRES=3600  # 1 hour
    )
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Create database tables
    with app.app_context():
        try:
            # Import all models to ensure they are registered with SQLAlchemy
            from .api.models import User, Note, Universe, Physics2D, Physics3D, SoundProfile, AudioSample, MusicPiece
            
            # Create tables
            db.drop_all()  # Clear any existing tables
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")
            raise e
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = None  # Disable redirect
    jwt = JWTManager(app)
    
    # Initialize rate limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=app.config['RATELIMIT_STORAGE_URL'],
        strategy=app.config['RATELIMIT_STRATEGY']
    )
    
    # Register blueprints
    from .api.routes import auth_bp, characters_bp, notes_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(characters_bp, url_prefix='/api/characters')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    
    # User loader for Flask-Login
    from .api.models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Serve favicon.ico
    @app.route('/favicon.ico')
    def favicon() -> Response:
        favicon_path = str(Path(__file__).parent.parent / 'frontend' / 'public')
        return send_from_directory(
            favicon_path,
            'favicon.ico',
            mimetype='image/vnd.microsoft.icon'
        )
    
    # Serve index.html for all non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path: str = '') -> Response:
        if not app.static_folder:
            app.static_folder = str(Path(__file__).parent.parent / 'frontend' / 'dist')
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    
    return app
