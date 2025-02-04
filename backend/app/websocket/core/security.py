from typing import Optional
from jose import jwt, JWTError
from app.core.config import settings
from app.models.core.user import User
from app.db.session import SessionLocal

async def verify_jwt_token(token: str) -> Optional[User]:
    """
    Verify JWT token and return the associated user.
    """
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        # Get user from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user is None:
                return None
            return user
        finally:
            db.close()

    except JWTError:
        return None
