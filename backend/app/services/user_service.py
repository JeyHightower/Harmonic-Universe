"""User service module."""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app import crud, models, schemas
from app.core.config import settings
from app.core.security import verify_password, get_password_hash

class UserService:
    """User service class."""

    @staticmethod
    def authenticate(db: Session, *, email: str, password: str) -> Optional[models.User]:
        """Authenticate user."""
        user = crud.user.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create_access_token(*, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify JWT token."""
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @staticmethod
    def create_user(db: Session, *, user_in: schemas.UserCreate) -> models.User:
        """Create new user."""
        # Check if user exists
        user = crud.user.get_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create user
        user_in_data = user_in.model_dump()
        user_in_data["hashed_password"] = get_password_hash(user_in_data.pop("password"))
        user = crud.user.create(db, obj_in=schemas.UserCreate(**user_in_data))
        return user

    @staticmethod
    def update_user(
        db: Session, *, user: models.User, user_in: schemas.UserUpdate
    ) -> models.User:
        """Update user."""
        # Check if email is taken
        if user_in.email and user_in.email != user.email:
            if crud.user.get_by_email(db, email=user_in.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

        # Update user
        user_data = user_in.model_dump(exclude_unset=True)
        if "password" in user_data:
            user_data["hashed_password"] = get_password_hash(user_data.pop("password"))

        updated_user = crud.user.update(db, db_obj=user, obj_in=user_data)
        return updated_user

    @staticmethod
    def is_active(user: models.User) -> bool:
        """Check if user is active."""
        return user.is_active

    @staticmethod
    def is_superuser(user: models.User) -> bool:
        """Check if user is superuser."""
        return user.is_superuser

user_service = UserService()
