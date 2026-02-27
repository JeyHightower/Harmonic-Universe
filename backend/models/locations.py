from config import db
from sqlalchemy.orm import mapped_column, Mapped, relationship, validates
from sqlalchemy import ForeignKey, String
from . import LocationType
from datetime import datetime
from typing import List

class Location (db.Model):
    __tablename__= 'locations'

    location_id : Mapped[int] = mapped_column(primary_key=True)
    universe_id: Mapped[int] = mapped_column(ForeignKey('universes.universe_id'), nullable=False)
    creator_id : Mapped[int] = mapped_column(ForeignKey('users.user_id'), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    location_type: Mapped[LocationType] = mapped_column(db.Enum(LocationType), default = LocationType.CITY, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable = True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    characters: Mapped[List['Character']] = relationship(secondary='character_locations', back_populates='locations')
    notes: Mapped[List['Note']] = relationship(secondary='location_notes', back_populates='locations')
    creator: Mapped['User'] = relationship(back_populates='locations')
    universe: Mapped['Universe'] = relationship(back_populates='locations')


    @validates('name')
    def validate_name(self, key, name):
        if not isinstance(name,str):
            raise ValueError('Name must be a string.')
        if len(name.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long.')
        return name.strip()

    @validates('location_type')
    def validate_location_type(self, key, location_type):
        if isinstance(location_type, str):
            try:
                return LocationType[location_type.upper()]
            except KeyError:
                raise ValueError(
                    f'Invalid location type: {location_type}'
                )
        return location_type

    def to_dict(self, summary=True):
        data = {
            'location_id': self.location_id,
            'name': self.name,
            'location_type': self.location_type.value,
            'group': self.location_type.grouping
        }
        if not summary:
            data['description'] = self.description
            data['universe_name'] = self.universe.name
        
        return data
    