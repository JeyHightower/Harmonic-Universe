"""Authentication service module."""
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from app.models import User
from app.extensions import db

class AuthService:
    """Service class for handling authentication operations."""

    @staticmethod
    def authenticate_user(email, password):
        """Authenticate a user and return access token."""
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            access_token = create_access_token(identity=user.id)
            return {'token': access_token, 'user': user.to_dict()}
        return None

    @staticmethod
    def register_user(username, email, password):
        """Register a new user."""
        if User.query.filter_by(email=email).first():
            return None

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=user.id)
        return {'token': access_token, 'user': user.to_dict()}
