"""
Flask extensions initialization.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_socketio import SocketIO
from app.db.base_model import Base, metadata

# Initialize extensions with our base class and metadata
db = SQLAlchemy(metadata=metadata)
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
ma = Marshmallow()
socketio = SocketIO()

def init_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)

    # Initialize SocketIO with app context
    if app.config.get('TESTING', False):
        # Simplified configuration for tests
        socketio.init_app(app,
                         async_mode=None,
                         cors_allowed_origins='*')
    else:
        # Full configuration for production
        socketio.init_app(app,
                         async_mode='threading',
                         cors_allowed_origins=app.config.get('CORS_ORIGINS', '*'),
                         logger=True,
                         engineio_logger=True,
                         ping_timeout=5,
                         ping_interval=25)
