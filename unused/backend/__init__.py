from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    CORS(app)

    # Import and initialize routes
    from .routes import init_routes
    init_routes(app)

    # Import and initialize WebSocket
    from .services import init_socketio
    socketio = init_socketio(app)

    # Import models for migrations
    from .models import User, Universe

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app, socketio
