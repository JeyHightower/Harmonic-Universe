# app/config.py
import os
import secrets
from datetime import timedelta


class Config:
    """Base configuration."""

    # Generate a random secret key if not set in environment
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev')

    # Flask
    FLASK_ENV = os.environ.get("FLASK_ENV", "production")
    DEBUG = False
    TESTING = False

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Redis
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    # Security
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = timedelta(days=7)
    CORS_HEADERS = "Content-Type"
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Rate Limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_DEFAULT = "100/hour"
    RATELIMIT_STRATEGY = "fixed-window"

    # WebSocket
    SOCKETIO_PING_TIMEOUT = 10
    SOCKETIO_PING_INTERVAL = 25
    SOCKETIO_MESSAGE_QUEUE = os.environ.get("SOCKETIO_MESSAGE_QUEUE", REDIS_URL)

    # Cache
    CACHE_TYPE = "simple"
    CACHE_DEFAULT_TIMEOUT = 300

    # File Upload
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", str(16 * 1024 * 1024)))  # 16MB default
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

    # Logging
    LOG_LEVEL = "INFO"
    LOG_FORMAT = os.environ.get("LOG_FORMAT", "%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    LOG_DATE_FORMAT = os.environ.get("LOG_DATE_FORMAT", "%Y-%m-%d %H:%M:%S")
    LOG_FILE = os.environ.get("LOG_FILE", "app.log")
    LOG_MAX_BYTES = int(os.environ.get("LOG_MAX_BYTES", str(10 * 1024 * 1024)))  # 10 MB default
    LOG_BACKUP_COUNT = int(os.environ.get("LOG_BACKUP_COUNT", "5"))

    @staticmethod
    def init_logging(app):
        """Initialize logging configuration"""
        import logging
        from logging.handlers import RotatingFileHandler
        import sys

        # Ensure LOG_LEVEL is set with a default
        if 'LOG_LEVEL' not in app.config:
            app.config['LOG_LEVEL'] = os.environ.get('LOG_LEVEL', 'INFO')

        # Set log level
        try:
            log_level = getattr(logging, app.config['LOG_LEVEL'].upper())
        except AttributeError:
            log_level = logging.INFO
            app.logger.warning(f"Invalid LOG_LEVEL '{app.config['LOG_LEVEL']}', using INFO")

        # Ensure other logging configs are set with defaults
        app.config.setdefault('LOG_FORMAT', '%(asctime)s [%(levelname)s] %(name)s: %(message)s')
        app.config.setdefault('LOG_DATE_FORMAT', '%Y-%m-%d %H:%M:%S')
        app.config.setdefault('LOG_FILE', 'app.log')
        app.config.setdefault('LOG_MAX_BYTES', 10 * 1024 * 1024)  # 10 MB
        app.config.setdefault('LOG_BACKUP_COUNT', 5)

        # Create formatters and handlers
        formatter = logging.Formatter(
            app.config['LOG_FORMAT'],
            app.config['LOG_DATE_FORMAT']
        )

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)

        # File handler
        try:
            file_handler = RotatingFileHandler(
                app.config['LOG_FILE'],
                maxBytes=app.config['LOG_MAX_BYTES'],
                backupCount=app.config['LOG_BACKUP_COUNT']
            )
            file_handler.setFormatter(formatter)
        except Exception as e:
            app.logger.warning(f"Could not create log file: {str(e)}")
            file_handler = None

        # Set up root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)

        # Remove existing handlers
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        root_logger.addHandler(console_handler)
        if file_handler:
            root_logger.addHandler(file_handler)

        # Set up Flask logger
        app.logger.setLevel(log_level)
        for handler in app.logger.handlers[:]:
            app.logger.removeHandler(handler)
        app.logger.addHandler(console_handler)
        if file_handler:
            app.logger.addHandler(file_handler)

        # Set up SQLAlchemy logger
        logging.getLogger('sqlalchemy').setLevel(logging.WARNING)

        # Set up WebSocket logger
        if app.config.get('DEBUG', False):
            logging.getLogger('engineio').setLevel(logging.DEBUG)
            logging.getLogger('socketio').setLevel(logging.DEBUG)
        else:
            logging.getLogger('engineio').setLevel(logging.WARNING)
            logging.getLogger('socketio').setLevel(logging.WARNING)

        app.logger.info('Logging initialized')


def get_database_uri(instance_dir, db_name):
    """Get the database URI for SQLite."""
    db_path = os.path.join(instance_dir, db_name)
    # Create empty database file if it doesn't exist
    if not os.path.exists(db_path):
        with open(db_path, 'w') as f:
            pass
    os.chmod(db_path, 0o666)
    return f'sqlite:///{os.path.abspath(db_path)}'


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    TESTING = False

    # Override strict requirements for development
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-key-change-me")

    def __init__(self):
        super().__init__()
        # Set up SQLite database path if DATABASE_URL is not set
        if not self.SQLALCHEMY_DATABASE_URI:
            # Get the backend directory path
            backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
            # Create instance directory if it doesn't exist
            instance_dir = os.path.join(backend_dir, 'instance')
            os.makedirs(instance_dir, exist_ok=True)
            os.chmod(instance_dir, 0o777)

            # Set database URI
            self.SQLALCHEMY_DATABASE_URI = get_database_uri(instance_dir, 'dev.db')

            print(f"Database configuration in DevelopmentConfig:")
            print(f"Backend directory: {backend_dir}")
            print(f"Instance directory: {instance_dir}")
            print(f"Database URI: {self.SQLALCHEMY_DATABASE_URI}")
            db_path = os.path.join(instance_dir, 'dev.db')
            print(f"File exists: {os.path.exists(db_path)}")
            print(f"File permissions: {oct(os.stat(db_path).st_mode)[-3:]}")

    # Development specific settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True  # Log SQL queries
    RATELIMIT_ENABLED = False  # Disable rate limiting in development

    # Less strict security for development
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development
    REMEMBER_COOKIE_SECURE = False

    # Development logging
    LOG_LEVEL = "DEBUG"

    # WebSocket development settings
    SOCKETIO_PING_TIMEOUT = 5
    SOCKETIO_PING_INTERVAL = 10
    SOCKETIO_MESSAGE_QUEUE = None  # Use memory queue in development

    # Cache settings
    CACHE_TYPE = "simple"

    # CORS settings for development
    CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]


class TestingConfig(Config):
    """Test configuration."""

    TESTING = True
    DEBUG = True
    # Use in-memory SQLite database
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # Security settings
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES = False
    JWT_ALGORITHM = "HS256"
    JWT_IDENTITY_CLAIM = "sub"

    # Disable rate limiting
    RATELIMIT_ENABLED = False
    # CORS settings
    CORS_ORIGINS = ["http://localhost:5173"]
    WTF_CSRF_ENABLED = False
    # Redis and Cache settings
    REDIS_URL = None
    SOCKETIO_MESSAGE_QUEUE = None
    # File upload settings
    UPLOAD_FOLDER = "test_uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    # Logging settings
    LOG_LEVEL = "DEBUG"
    # WebSocket settings
    SOCKETIO_PING_TIMEOUT = 1
    SOCKETIO_PING_INTERVAL = 1
    SOCKETIO_ASYNC_MODE = 'threading'
    SOCKETIO_ALWAYS_CONNECT = True
    SOCKETIO_CORS_ALLOWED_ORIGINS = '*'
    SOCKETIO_LOGGER = True
    SOCKETIO_ENGINEIO_LOGGER = True
    SOCKETIO_MANAGE_SESSION = False
    SOCKETIO_UPGRADE_LOGGER = True
    SOCKETIO_JSON = False
    # Exception handling
    PROPAGATE_EXCEPTIONS = True
    PRESERVE_CONTEXT_ON_EXCEPTION = False


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    SECRET_KEY = os.environ.get("SECRET_KEY")
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    RATELIMIT_STORAGE_URL = REDIS_URL
    SOCKETIO_MESSAGE_QUEUE = os.environ.get("SOCKETIO_MESSAGE_QUEUE")

    # Security
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True

    # Use PostgreSQL in production
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace(
            "postgres://", "postgresql://", 1
        )

    SQLALCHEMY_ECHO = False


# Configuration dictionary
config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
