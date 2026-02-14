from . import db
from sqlalchemy.orm import mapped_column, Mapped, relationship, validates
from sqlalchemy import ForeignKey, String, JSON
from datetime import datetime
from typing import List

class Character(db.Model):
    __tablename__ = 'characters'

    character_id: Mapped[int] = mapped_column(primary_key = True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), nullable = False)
    name: Mapped[str] = mapped_column('name', String(100), nullable = False)
    age: Mapped[int] = mapped_column(nullable = True)
    origin: Mapped[str] = mapped_column(String(200), nullable = True)
    main_power_set: Mapped[str] = mapped_column(String(100), nullable = False, unique = True)
    secondary_power_set: Mapped[str] = mapped_column(String(100), nullable = False, unique = True)
    skills: Mapped[List[str]] = mapped_column(JSON, nullable = False, default = 'list')
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    universes: Mapped[List['Universe']] = relationship(secondary = 'character_universes', back_populates = 'characters')
    creator: Mapped['User'] = relationship(back_populates = 'created_characters')


    @validates('skills', 'name', 'main_power_set', 'secondary_power_set', 'user_id')
    def validate_character_data(self, key, value):
        if key == 'name':
            if not isinstance(value, str):
                raise TypeError('name must be a string.')
            stripped = value.strip()
            if len(stripped ) < 2 or len(stripped) > 30:
                raise ValueError('Name must be between 2 and 30 characters long.')
            if not stripped[0].isalpha():
                raise ValueError('Name must begin with a letter.')
            return stripped.capitalize()
        elif key =='main_power_set' or key == 'secondary_power_set':
            if not isinstance(value, str):
                raise TypeError(f'{key.replace('_', ' ').capitalize()} must be a str.')
            if len(value.strip()) < 3:
                raise ValueError(f'{key.replace('_', ' ').capitalize()} cannot be less than 3 characters.')
            return value.strip().capitalize()
        elif key == 'skills':
            if not isinstance(value, list):
                raise TypeError('skills must be a list')
            if not all(isinstance(w, str) and len(w.strip()) > 2 for w in value):
                raise ValueError('Each skill  must be 3 or more characters long.')
            if not all(w.strip()[0].isalpha() for w in value):
                raise ValueError('Each skill must start with a letter')
            return [w.strip().capitalize() for w in value]
        elif key == 'user_id':
            if not isinstance(value, int):
                raise TypeError('user_id must be an integer')
            if value <= 0:
                raise ValueError('user_id must be greater than 0')
            return int(value)
        return value



    def to_dict(self, summary = True):
        data = {
        'user_id': self.user_id,
        'name': self.name,
        'age': self.age,
        'main_power_set': self.main_power_set,
        'created_at': self.created_at.isoformat()
        }

        if not summary:
            data['origin'] = self.origin
            data['secondary_power_set'] = self.secondary_power_set
            data['skills'] = self.skills
            data['universes']=[u.name for u in universes] if self.universes else []

        return data



