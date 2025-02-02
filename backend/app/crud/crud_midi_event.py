from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.midi_event import MIDIEvent, MIDIEventType
from app.schemas.midi_event import MIDIEventCreate, MIDIEventUpdate

class CRUDMIDIEvent(CRUDBase[MIDIEvent, MIDIEventCreate, MIDIEventUpdate]):
    def get_by_audio_file(
        self, db: Session, *, audio_file_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[MIDIEvent]:
        return (
            db.query(self.model)
            .filter(MIDIEvent.audio_file_id == audio_file_id)
            .order_by(MIDIEvent.timestamp)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_type(
        self, db: Session, *, audio_file_id: UUID, event_type: MIDIEventType
    ) -> List[MIDIEvent]:
        return (
            db.query(self.model)
            .filter(
                MIDIEvent.audio_file_id == audio_file_id,
                MIDIEvent.event_type == event_type
            )
            .order_by(MIDIEvent.timestamp)
            .all()
        )

    def get_by_time_range(
        self, db: Session, *, audio_file_id: UUID, start_time: float, end_time: float
    ) -> List[MIDIEvent]:
        return (
            db.query(self.model)
            .filter(
                MIDIEvent.audio_file_id == audio_file_id,
                MIDIEvent.timestamp >= start_time,
                MIDIEvent.timestamp <= end_time
            )
            .order_by(MIDIEvent.timestamp)
            .all()
        )

    def get_by_channel(
        self, db: Session, *, audio_file_id: UUID, channel: int
    ) -> List[MIDIEvent]:
        return (
            db.query(self.model)
            .filter(
                MIDIEvent.audio_file_id == audio_file_id,
                MIDIEvent.channel == channel
            )
            .order_by(MIDIEvent.timestamp)
            .all()
        )

    def create_batch(
        self, db: Session, *, events: List[MIDIEventCreate]
    ) -> List[MIDIEvent]:
        db_events = [MIDIEvent(**event.model_dump()) for event in events]
        db.add_all(db_events)
        db.commit()
        for event in db_events:
            db.refresh(event)
        return db_events

midi_event = CRUDMIDIEvent(MIDIEvent)
