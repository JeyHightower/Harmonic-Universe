from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.core.security import create_access_token
from backend.app.models.user import User
from backend.app.core.config import settings
from backend.app.utils.email import send_verification_email, send_password_reset_email


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not user.check_password(password):
            return None
        return user

    def create_user(self, email: str, password: str) -> User:
        user = User(email=email)
        user.set_password(password)
        user.generate_verification_token()

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        # Send verification email
        send_verification_email(user.email, user.verification_token)

        return user

    def verify_email(self, token: str) -> bool:
        user = (
            self.db.query(User)
            .filter(
                User.verification_token == token,
                User.verification_token_expires > datetime.utcnow(),
            )
            .first()
        )

        if not user:
            return False

        user.verify_email()
        self.db.commit()
        return True

    def request_password_reset(self, email: str) -> bool:
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return False

        token = user.generate_reset_token()
        self.db.commit()

        # Send password reset email
        send_password_reset_email(user.email, token)
        return True

    def reset_password(self, token: str, new_password: str) -> bool:
        user = (
            self.db.query(User)
            .filter(
                User.reset_token == token, User.reset_token_expires > datetime.utcnow()
            )
            .first()
        )

        if not user:
            return False

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        self.db.commit()
        return True

    def refresh_access_token(self, refresh_token: str) -> Optional[dict]:
        user = (
            self.db.query(User)
            .filter(
                User.refresh_token == refresh_token,
                User.refresh_token_expires > datetime.utcnow(),
            )
            .first()
        )

        if not user:
            return None

        # Generate new access token
        access_token = create_access_token(user.id)

        # Generate new refresh token
        new_refresh_token = user.generate_refresh_token()
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    def revoke_refresh_token(self, refresh_token: str) -> bool:
        user = self.db.query(User).filter(User.refresh_token == refresh_token).first()
        if not user:
            return False

        user.refresh_token = None
        user.refresh_token_expires = None
        self.db.commit()
        return True
