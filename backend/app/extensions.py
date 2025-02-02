"""
Flask extensions initialization.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_socketio import SocketIO

# Initialize extensions
db = SQLAlchemy()
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
    socketio.init_app(app,
                      async_mode='threading',
                      cors_allowed_origins=app.config['CORS_ORIGINS'],
                      logger=True,
                      engineio_logger=True,
                      ping_timeout=5,
                      ping_interval=25)
