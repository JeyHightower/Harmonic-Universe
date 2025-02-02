"""
Token schemas.
"""

from typing import Optional
from pydantic import BaseModel, UUID4

class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: Optional[UUID4] = None
    exp: Optional[int] = None

class TokenData(BaseModel):
    """Token data schema."""
    username: Optional[str] = None
    scopes: list[str] = []
