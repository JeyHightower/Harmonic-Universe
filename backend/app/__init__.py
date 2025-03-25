from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from .api.database import db

def create_app():
    app = Flask(__name__)
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    
    # Handle Render.com PostgreSQL URL format
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        elif database_url == '<your-postgres-database-url>':
            print("Error: DATABASE_URL is not properly configured. Please set a valid database URL in your environment variables.")
            raise ValueError("Invalid DATABASE_URL configuration")
    else:
        # For local development, use PostgreSQL
        database_url = "postgresql://postgres:postgres@localhost:5432/harmonic_universe"
        print(f"Using local PostgreSQL database at: {database_url}")
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    # Default configuration
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads'),
        MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB max file size
        RATELIMIT_STORAGE_URL=os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
        RATELIMIT_STRATEGY="fixed-window",
        PORT=port,
        HOST=host
    )
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate = Migrate(app, db)
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    # Initialize rate limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=app.config['RATELIMIT_STORAGE_URL'],
        strategy=app.config['RATELIMIT_STRATEGY']
    )
    
    # Register blueprints
    from .api.routes import auth_bp, characters_bp, notes_bp, physics_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(characters_bp, url_prefix='/api/characters')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(physics_bp, url_prefix='/api/physics')
    
    # User loader for Flask-Login
    from .api.models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    return app
