from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from config import db

class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    jti: Mapped[str] = mapped_column(String(36), nullable = False, index = True)
    created_at: Mapped[datetime] = mapped_column(nullable = False)