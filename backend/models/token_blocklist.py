from sqlalchemy import String
from datetime import datetime


class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    jti: Mapped[str] = mapped_column(String(36), nullable = False, index = True)
    created_at: Mapped[datetime] = mapped_column(nullable = False)