from typing import Generator
from sqlalchemy.orm import Session
from app.db.session import SessionLocal

def override_get_db() -> Generator[Session, None, None]:
    """
    Override get_db dependency for testing.
    Returns a database session that will be used for testing.
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()
