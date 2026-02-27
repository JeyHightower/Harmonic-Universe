from config import db
from . import character_notes
from sqlalchemy.orm import mapped_column, relationship, validates, Mapped
from sqlalchemy import String, Text, ForeignKey
from datetime import datetime
from typing import List

class Note(db.Model):
    __tablename__ = 'notes'

    note_id: Mapped[int] = mapped_column(primary_key = True)
    title: Mapped[str] = mapped_column(String(100), nullable = False)
    content: Mapped[str] = mapped_column(Text, nullable = True)
    creator_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), nullable = False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    characters: Mapped[List['Character']] = relationship(secondary = 'character_notes', back_populates = 'notes')
    universes:Mapped[List['Universe']] = relationship(secondary = 'note_universes', back_populates = 'notes')
    creator: Mapped['User'] = relationship(back_populates = 'notes')
    locations: Mapped[List['Location']]  = relationship(secondary='location_notes', back_populates = 'notes')



    @validates('title')
    def validate_title(self, key, value):
        if not value or not value.strip():
            raise ValueError(f'{key} value cannot be empty.')
        if not isinstance(value, str):
                raise ValueError(f'{key}  value must be a string.')
        if len(value.strip()) < 3 or len(value.strip()) > 100:
            raise ValueError('Input must be between 3 and 100 characters.')
        parts = value.strip().split()
        if len(parts) > 10:
            raise ValueError('Input must be 10 words or less.')
        return value.strip().capitalize()


    def to_dict(self, summary = True):
        data = {
            'note_id': self.note_id,
            'title': self.title,
            'creator_id': self.creator_id,
            'created_at': self.created_at,
            'characters': [{'id': c .character_id, 'name': c.name} for c in self.characters],
            'universes': [{'id': u.universe_id,'name': u.name } for u in self.universes]
        }

        if not summary:
                data['content'] = self.content
        return data
            

