# app/__init__.py
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
from app.config import Config
from app.extensions import db, migrate, cors, csrf
from flask_wtf.csrf import generate_csrf

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    csrf.init_app(app)

    # Disable CSRF for auth routes
    app.config['WTF_CSRF_CHECK_DEFAULT'] = False
    csrf.exempt('/api/auth/signup')
    csrf.exempt('/api/auth/login')
    csrf.exempt('/api/auth/token')
    csrf.exempt('/api/auth/token/refresh')
    csrf.exempt('/api/auth/validate')

    # Initialize session
    if app.config.get('SESSION_TYPE'):
        Session(app)

    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "X-CSRF-Token", "Authorization"],
            "expose_headers": ["X-CSRF-Token"],
            "supports_credentials": True
        }
    })

    # CSRF exemption for token auth
    @csrf.exempt
    def check_token_auth():
        auth_header = request.headers.get('Authorization')
        return auth_header and auth_header.startswith('Bearer ')

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.universe_routes import universe_bp
    from app.routes.music_routes import music_bp
    from app.routes.physics_routes import physics_bp
    from app.routes.storyboard_routes import storyboard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(music_bp, url_prefix='/api/universes/<int:universe_id>/music')
    app.register_blueprint(physics_bp, url_prefix='/api/universes/<int:universe_id>/physics')
    app.register_blueprint(storyboard_bp, url_prefix='/api/universes/<int:universe_id>/storyboards')

    # CSRF token route
    @app.route('/api/csrf/token', methods=['GET'])
    def get_csrf_token():
        token = generate_csrf()
        response = jsonify({'csrf_token': token})
        response.headers['X-CSRF-Token'] = token
        return response

    # Error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            'error': str(e.description) if hasattr(e, 'description') else 'Bad Request',
            'type': 'validation_error'
        }), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({
            'error': str(e.description) if hasattr(e, 'description') else 'Unauthorized',
            'type': 'auth_error'
        }), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({
            'error': str(e.description) if hasattr(e, 'description') else 'Forbidden',
            'type': 'auth_error'
        }), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            'error': str(e.description) if hasattr(e, 'description') else 'Not Found',
            'type': 'not_found_error'
        }), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({
            'error': str(e.description) if hasattr(e, 'description') else 'Internal Server Error',
            'type': 'server_error'
        }), 500

    return app
