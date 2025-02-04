"""
User schemas.
"""

from typing import List, Optional, TYPE_CHECKING
from datetime import datetime
from pydantic import BaseModel, EmailStr, constr, UUID4, Field, validator
from uuid import UUID

if TYPE_CHECKING:
    from backend.app.models.user import User
    from backend.app.schemas.scene import Scene
    from backend.app.schemas.universe import Universe

# Shared properties
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False

# Properties to receive via API on creation
class UserCreate(UserBase):
    """Create user schema."""
    password: str
    username: str

    @validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'Username must be alphanumeric'
        return v

    @validator('password')
    def password_min_length(cls, v):
        min_length = 8
        if len(v) < min_length:
            raise ValueError(f'Password must be at least {min_length} characters long')
        return v

# Properties to receive via API on update
class UserUpdate(UserBase):
    """Update user schema."""
    password: Optional[str] = None

    @validator('password')
    def password_min_length(cls, v):
        if v is not None:
            min_length = 8
            if len(v) < min_length:
                raise ValueError(f'Password must be at least {min_length} characters long')
        return v

# Properties shared by models stored in DB
class UserInDB(UserBase):
    """DB user schema."""
    id: UUID
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True

# Additional response schemas
class UserResponse(UserBase):
    """User schema to return to client."""
    id: UUID
    username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str

class UserWithUniverses(UserResponse):
    """User schema with universes."""
    if TYPE_CHECKING:
        from backend.app.schemas.universe import Universe
    universes: List["Universe"] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: Optional[UUID4] = None
    exp: Optional[int] = None
