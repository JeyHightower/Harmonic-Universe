from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from .api import db, migrate, api_bp

def create_app():
    app = Flask(__name__)
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url or database_url.startswith('sqlite://'):
        # Use SQLite for local development
        db_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'app.db'))
        database_url = f'sqlite:///{db_path}'
        print(f"Using local SQLite database at: {database_url}")
    elif database_url.startswith('postgres://'):
        # Handle Render.com PostgreSQL URL format
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
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
    migrate.init_app(app, db)
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
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # User loader for Flask-Login
    from .api.models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        try:
            db.session.execute('SELECT 1')
            db_status = "connected"
        except Exception as e:
            db_status = f"disconnected: {str(e)}"
        
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "database": db_status
        }), 200
    
    return app
