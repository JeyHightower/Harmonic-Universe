from datetime import datetime, timedelta
from sqlalchemy import Boolean, Column, DateTime, String
from app.db.base_class import Base
from werkzeug.security import check_password_hash, generate_password_hash

class User(Base):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    is_verified = Column(Boolean(), default=False)
    verification_token = Column(String(255), unique=True, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    reset_token = Column(String(255), unique=True, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    refresh_token = Column(String(255), unique=True, nullable=True)
    refresh_token_expires = Column(DateTime, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_verification_token(self):
        from secrets import token_urlsafe
        self.verification_token = token_urlsafe(32)
        self.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        return self.verification_token

    def generate_reset_token(self):
        from secrets import token_urlsafe
        self.reset_token = token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token

    def generate_refresh_token(self):
        from secrets import token_urlsafe
        self.refresh_token = token_urlsafe(32)
        self.refresh_token_expires = datetime.utcnow() + timedelta(days=7)
        return self.refresh_token

    def verify_email(self):
        self.is_verified = True
        self.verification_token = None
        self.verification_token_expires = None
