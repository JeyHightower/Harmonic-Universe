from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from config import Config
from .db.session import SessionLocal, get_db, Base
from sqlalchemy import create_engine

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize database
    engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    Base.metadata.create_all(bind=engine)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Register blueprints
    from app.api.routes import (
        auth_bp,
        universe_bp,
        audio_bp,
        visualization_bp,
        physics_bp,
        ai_bp
    )

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    app.register_blueprint(visualization_bp, url_prefix='/api/visualizations')
    app.register_blueprint(physics_bp, url_prefix='/api/physics')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    # Register error handlers
    from app.core.errors import register_error_handlers
    register_error_handlers(app)

    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}

    return app
