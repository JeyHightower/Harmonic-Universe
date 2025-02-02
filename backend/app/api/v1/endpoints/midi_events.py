from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.audio.midi_processor import MIDIProcessor
from app.models.midi_event import MIDIEventType
from app.models.audio_file import AudioFormat

router = APIRouter()

@router.get("/audio-file/{audio_file_id}", response_model=List[schemas.MIDIEvent])
def read_midi_events(
    audio_file_id: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve MIDI events for an audio file.
    """
    audio_file = crud.audio_file.get(db=db, id=audio_file_id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")
    if audio_file.format != AudioFormat.MIDI:
        raise HTTPException(status_code=400, detail="File is not a MIDI file")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    events = crud.midi_event.get_by_audio_file(
        db=db, audio_file_id=audio_file.id, skip=skip, limit=limit
    )
    return events

@router.post("/extract/{audio_file_id}", response_model=List[schemas.MIDIEvent])
def extract_midi_events(
    *,
    db: Session = Depends(deps.get_db),
    audio_file_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Extract MIDI events from a MIDI file.
    """
    audio_file = crud.audio_file.get(db=db, id=audio_file_id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")
    if audio_file.format != AudioFormat.MIDI:
        raise HTTPException(status_code=400, detail="File is not a MIDI file")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Extract MIDI events
    processor = MIDIProcessor(audio_file.file_path)
    events = processor.extract_events()

    # Create events in database
    return crud.midi_event.create_batch(db=db, events=events)

@router.post("/create/{audio_file_id}", response_model=List[schemas.MIDIEvent])
def create_midi_events(
    *,
    db: Session = Depends(deps.get_db),
    audio_file_id: str,
    events_in: schemas.MIDIEventBatch,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new MIDI events.
    """
    audio_file = crud.audio_file.get(db=db, id=audio_file_id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")
    if audio_file.format != AudioFormat.MIDI:
        raise HTTPException(status_code=400, detail="File is not a MIDI file")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Set audio_file_id for all events
    for event in events_in.events:
        event.audio_file_id = audio_file_id

    return crud.midi_event.create_batch(db=db, events=events_in.events)

@router.get("/type/{audio_file_id}/{event_type}", response_model=List[schemas.MIDIEvent])
def read_midi_events_by_type(
    audio_file_id: str,
    event_type: MIDIEventType,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve MIDI events by type.
    """
    audio_file = crud.audio_file.get(db=db, id=audio_file_id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    events = crud.midi_event.get_by_type(
        db=db, audio_file_id=audio_file.id, event_type=event_type
    )
    return events

@router.get("/timerange/{audio_file_id}", response_model=List[schemas.MIDIEvent])
def read_midi_events_by_timerange(
    audio_file_id: str,
    start_time: float,
    end_time: float,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve MIDI events within a time range.
    """
    audio_file = crud.audio_file.get(db=db, id=audio_file_id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    events = crud.midi_event.get_by_time_range(
        db=db,
        audio_file_id=audio_file.id,
        start_time=start_time,
        end_time=end_time
    )
    return events

@router.delete("/{id}")
def delete_midi_event(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete MIDI event.
    """
    event = crud.midi_event.get(db=db, id=id)
    if not event:
        raise HTTPException(status_code=404, detail="MIDI event not found")

    audio_file = crud.audio_file.get(db=db, id=event.audio_file_id)
    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    crud.midi_event.remove(db=db, id=id)
    return {"status": "success"}
