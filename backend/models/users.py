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
    
    # @property
    # def password(self) -> str:
    #     raise AttributeError('Password is not a readable attribute')
    
    # @password.setter
    # def password(self, password):
    #     self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    # def check_password(self, password):
    #     return bcrypt.check_password_hash(self.password, password)

    # @property
    # def email(self):
    #     return self.email

    # @email.setter
    # def email(self, value):
    #     if '@' not in value:
    #         raise  ValueError('Invalid Email')
    #     parts = value.split('@')
    #     if len(parts)  != 2 or "." not in parts[1]:
    #         raise ValueError("Invalid Domain")
    #     if len(parts[0]) <= 2:
    #         raise ValueError("Email prefix is too short")
        
    #     self.email = value.lower().strip()


    def to_dict(self, summary : bool = True) -> dict:
        """        
         Transforms the User model into a dictionary for Json responses. 
         Flag 'summary' toggles between a light version and a full profile.
        """

        data = {  
            'user_id': self.user_id,
            'name': self.name,
            'username': self.username,
            'email': self.email,
            'universe_count': len(self.owned_universes),
            'created_at': self.created_at.isoformat()
        }

        if not summary:
            data['bio'] = self.bio
            data['universes'] = [u.name for u in self.owned_universes] if self.owned_universes else []
            data['owned_universe_ids'] = [u.universe_id for u in self.owned_universes] if self.owned_universes else []
        
        return data
        
    @validates("name", "username", "email" )
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

       