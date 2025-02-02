"""
User schemas.
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, constr, UUID4, Field, validator
from app.schemas.universe import Universe
from app.schemas.scene import Scene
from app.extensions import ma
from app.models.user import User

# Shared properties
class UserBase(BaseModel):
    """Base user schema."""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    is_active: Optional[bool] = True
    is_superuser: bool = False
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)

    @validator('username')
    def username_alphanumeric(cls, v):
        if v and not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

# Properties to receive via API on creation
class UserCreate(UserBase):
    """Create user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: constr(min_length=8, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=100)

    @validator('password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

# Properties to receive via API on update
class UserUpdate(UserBase):
    """Update user schema."""
    password: Optional[constr(min_length=8, max_length=100)] = None
    current_password: Optional[str] = None

    @validator('password')
    def password_strength(cls, v):
        if v:
            if not any(c.isupper() for c in v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not any(c.islower() for c in v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not any(c.isdigit() for c in v):
                raise ValueError('Password must contain at least one number')
        return v

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    """Base DB user schema."""
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True
        json_encoders = {
            UUID4: str,
            datetime: lambda v: v.isoformat()
        }

# Rename Pydantic User class to avoid conflict
class UserResponseSchema(UserInDBBase):
    """User schema to return to client."""
    pass

# Properties stored in DB
class UserInDB(UserInDBBase):
    """DB user schema."""
    hashed_password: str

class UserResponse(UserResponseSchema):
    """User response schema."""
    universes: List[Universe] = []
    scenes: List[Scene] = []

    class Config:
        from_attributes = True
        json_encoders = {
            UUID4: str,
            datetime: lambda v: v.isoformat()
        }

class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

class Token(BaseModel):
    """Token schema."""
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: Optional[UUID4] = None
    exp: Optional[int] = None

# Update UserSchema to use the correct SQLAlchemy User model
class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User  # Ensure this is the SQLAlchemy model
        load_instance = True

# Create an instance of the schema
user_schema = UserSchema()
user_create_schema = UserSchema()
user_login_schema = UserSchema()
