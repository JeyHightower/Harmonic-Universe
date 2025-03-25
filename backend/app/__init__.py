from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
import os
import redis
from limits.storage import RedisStorage

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
talisman = Talisman()

# Initialize Redis for rate limiting
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
try:
    redis_client = redis.from_url(redis_url)
    # Create Redis storage with URL string instead of client
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=redis_url,
        strategy="fixed-window"
    )
except (redis.ConnectionError, Exception) as e:
    print(f"Warning: Redis initialization failed ({str(e)}). Falling back to in-memory storage for rate limiting.")
    limiter = Limiter(key_func=get_remote_address)

def create_app(test_config=None):
    app = Flask(__name__, static_folder="static")
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    
    # Handle Render.com PostgreSQL URL format
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    elif not database_url:
        # For local development, create instance directory if it doesn't exist
        basedir = os.path.abspath(os.path.dirname(__file__))
        instance_dir = os.path.join(os.path.dirname(basedir), 'instance')
        os.makedirs(instance_dir, exist_ok=True)
        database_url = f"sqlite:///{os.path.join(instance_dir, 'app.db')}"
    
    # Default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY"),
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "True").lower() == "true",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        PERMANENT_SESSION_LIFETIME=3600,  # 1 hour
        RATELIMIT_STORAGE_URL=os.environ.get("RATELIMIT_STORAGE_URL", redis_url),
        RATELIMIT_STRATEGY="fixed-window",
        RATELIMIT_DEFAULT="200 per day;50 per hour;1 per second",
        RATELIMIT_HEADERS_ENABLED=True,
    )

    # Override config with test config if passed
    if test_config is not None:
        app.config.update(test_config)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    talisman.init_app(app)
    limiter.init_app(app)

    # Configure Talisman security headers
    talisman.force_https = os.environ.get("FORCE_HTTPS", "True").lower() == "true"
    talisman.strict_transport_security = True
    talisman.session_cookie_secure = True
    talisman.content_security_policy = {
        'default-src': "'self'",
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:", "https:"],
        'font-src': ["'self'", "https:", "data:"],
        'connect-src': ["'self'", "https:"],
    }

    # Configure CORS with specific settings
    CORS(app, resources={
        r"/api/*": {
            "origins": os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })

    # User loader for Flask-Login
    from .api.models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    from .api.routes.characters import characters_bp
    from .api.routes.notes import notes_bp
    from .api.routes.auth import auth_bp
    from .api.routes.physics import physics_bp
    
    app.register_blueprint(characters_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(physics_bp)

    # Add rate limiting to auth routes
    from .api.routes.auth import auth_bp
    limiter.limit("5 per minute")(auth_bp)
    limiter.limit("100 per day")(auth_bp)

    return app
