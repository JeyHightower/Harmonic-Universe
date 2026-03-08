from . import character_universes
from config import db
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy import String
from flask_bcrypt import generate_password_hash, check_password_hash, Bcrypt
from flask_login import UserMixin
from datetime import datetime
from typing import List

bcrypt = Bcrypt()


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    user_id: Mapped[int] = mapped_column(primary_key=True)
    is_admin: Mapped[bool]= mapped_column(default=False, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(250), nullable=False)
    bio: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    owned_universes: Mapped[List['Universe']] = relationship(back_populates = 'creator', cascade = 'all, delete-orphan')
    created_characters: Mapped[List['Character']] = relationship(back_populates = 'creator', cascade ='all, delete-orphan')
    notes: Mapped[List['Note']] = relationship(back_populates = 'creator', cascade ='all, delete-orphan')
    locations: Mapped[List['Location']] = relationship(back_populates = 'creator', cascade = 'all, delete-orphan')
    

    @validates("name", "username", "email")
    def user_validation(self, attribute, value):
        if not value or len(value.strip() ) < 2:
            raise ValueError(f"The {attribute} field is not long enough!!")
        if attribute == "username":
            return value.strip().capitalize()
        if attribute == "email":
            if '@' not in value or "." not in value.split('@')[-1]:
                raise ValueError("Invalid Email Format")
            return value.strip().lower()
        return value.strip().capitalize()

     
    def to_dict(self, summary : bool = True) -> dict:
        """        
         Transforms the User model into a dictionary for Json responses. 
         Flag 'summary' toggles between a light version and a full profile.
        """

        data = {  
            'user_id': self.user_id,
            'is_admin': self.is_admin,
            'username': self.username,
            'email': self.email
        }

        if not summary:
            data['name']= self.name,
            data['bio'] = self.bio
            data['universes'] = [u.name for u in self.owned_universes] if self.owned_universes else []
            data['owned_universe_ids'] = [u.universe_id for u in self.owned_universes] if self.owned_universes else []
            data['universe_count'] = len(self.owned_universes),
            data['created_at'] = self.created_at.isoformat()
        
        return data
        

       