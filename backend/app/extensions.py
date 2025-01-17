from flask_caching import Cache
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from redis import Redis

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
csrf = CSRFProtect()
session = Session()
cache = Cache()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

def init_extensions(app):
    """Initialize Flask extensions."""
    # Initialize SQLAlchemy
    db.init_app(app)

    # Initialize Flask-Migrate
    migrate.init_app(app, db)

    # Initialize CORS
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": app.config['CORS_METHODS'],
            "allow_headers": app.config['CORS_ALLOW_HEADERS'],
            "supports_credentials": app.config['CORS_SUPPORTS_CREDENTIALS']
        }
    })

    # Initialize CSRF protection
    csrf.init_app(app)

    # Initialize Redis connection
    redis_client = Redis(
        host=app.config['REDIS_HOST'],
        port=app.config['REDIS_PORT'],
        password=app.config['REDIS_PASSWORD'],
        db=app.config['REDIS_DB'],
        decode_responses=True
    )

    # Initialize Flask-Session with Redis
    app.config['SESSION_REDIS'] = redis_client
    session.init_app(app)

    # Initialize Flask-Caching with Redis
    cache.init_app(app)

    # Initialize Flask-Limiter with Redis
    limiter.init_app(app)

    # Register extensions cleanup
    @app.teardown_appcontext
    def cleanup_extensions(exception=None):
        """Clean up extension resources."""
        if hasattr(app, 'redis'):
            app.redis.connection_pool.disconnect()
        db.session.remove()
