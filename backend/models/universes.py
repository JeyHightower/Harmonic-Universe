from . import db, AlignmentType, users_universes
from datetime import datetime
from sqlalchemy.orm import relationship, mapped_column, Mapped
from sqlalchemy import String
from typing import List


class Universe(db.Model):
    __tablename__ = 'universes'

    universe_id: Mapped[int] = mapped_column(primary_key=True)
    _name: Mapped[str] = mapped_column('name',String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(300), nullable=True)
    alignment: Mapped[AlignmentType] = mapped_column(db.Enum(AlignmentType), default=AlignmentType.NEUTRAL, nullable=False )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    members: Mapped[List['User']] = relationship(secondary='users_universes', back_populates='universes')

    
    @validates('_name')
    def validate_name(self, key, value):
        if not value or not value.strip():
            raise ValueError('Universe name is required')
        if len(value.strip()) < 3:
            raise ValueError('Universe name must be at least 3 characters long')
        parts = value.strip().split()
        if len(parts) > 5:
            raise ValueError('Universe name must be less than 5 words')
        for part in parts:
            if len(part) >19:
                raise ValueError('Each word in the universe name must be less than 20 characters')
        return value.strip().upper()

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        self._name = value


    def to_dict(self, summary = True):
        data = {
            'universe_id': self.universe_id,
            'name': self.name,
            'alignment': self.alignment.value if self.alignment else None,
            'members_count': len(self.members)
        }
        if not summary:
            data['description']=self.description
            data['created_at']=self.created_at.isoformat()
            data['members']=[m.name for m in self.members]
        
        return data
        

