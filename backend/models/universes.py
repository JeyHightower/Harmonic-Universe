from . import db, AlignmentType, users_universes
from datetime import datetime
from sqlalchemy.orm import relationship, mapped_column, Mapped
from sqlalchemy import String


class Universe(db.Model):
    __tablename__ = 'universes'

    universe_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(300), nullable=True)
    alignment: Mapped[AlignmentType] = mapped_column(db.Enum(AlignmentType), default=AlignmentType.NEUTRAL, nullable=False )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    members: Mapped[List['User']] = relationship(secondary='users_universes', back_populates='universes')


    def to_dict(self):
        return {
            'universe_id': self.universe_id,
            'name': self.name,
            'description': self.description,
            'alignment': self.alignment.value if self.alignment else None
        }

