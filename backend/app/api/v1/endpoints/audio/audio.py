"""
Audio API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.audio import (
    crud_midi_event,
    crud_midi_sequence,
    crud_audio_track,
    crud_audio_marker,
    crud_audio_automation
)
from app.schemas.audio import (
    MIDIEvent,
    MIDIEventCreate,
    MIDIEventUpdate,
    MIDISequence,
    MIDISequenceCreate,
    MIDISequenceUpdate,
    AudioTrack,
    AudioTrackCreate,
    AudioTrackUpdate,
    AudioMarker,
    AudioMarkerCreate,
    AudioMarkerUpdate,
    AudioAutomation,
    AudioAutomationCreate,
    AudioAutomationUpdate
)

router = APIRouter()

# MIDI Sequences
@router.get("/sequences/", response_model=List[MIDISequence])
def read_midi_sequences(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[MIDISequence]:
    """Retrieve MIDI sequences."""
    return crud_midi_sequence.get_multi(db, skip=skip, limit=limit)

@router.post("/sequences/", response_model=MIDISequence)
def create_midi_sequence(
    *,
    db: Session = Depends(deps.get_db),
    sequence_in: MIDISequenceCreate
) -> MIDISequence:
    """Create new MIDI sequence."""
    return crud_midi_sequence.create(db, obj_in=sequence_in)

@router.get("/sequences/{sequence_id}", response_model=MIDISequence)
def read_midi_sequence(
    sequence_id: int,
    db: Session = Depends(deps.get_db)
) -> MIDISequence:
    """Get specific MIDI sequence."""
    sequence = crud_midi_sequence.get(db, id=sequence_id)
    if not sequence:
        raise HTTPException(status_code=404, detail="MIDI sequence not found")
    return sequence

@router.put("/sequences/{sequence_id}", response_model=MIDISequence)
def update_midi_sequence(
    *,
    db: Session = Depends(deps.get_db),
    sequence_id: int,
    sequence_in: MIDISequenceUpdate
) -> MIDISequence:
    """Update MIDI sequence."""
    sequence = crud_midi_sequence.get(db, id=sequence_id)
    if not sequence:
        raise HTTPException(status_code=404, detail="MIDI sequence not found")
    return crud_midi_sequence.update(db, db_obj=sequence, obj_in=sequence_in)

@router.delete("/sequences/{sequence_id}")
def delete_midi_sequence(
    *,
    db: Session = Depends(deps.get_db),
    sequence_id: int
) -> dict:
    """Delete MIDI sequence."""
    sequence = crud_midi_sequence.get(db, id=sequence_id)
    if not sequence:
        raise HTTPException(status_code=404, detail="MIDI sequence not found")
    crud_midi_sequence.remove(db, id=sequence_id)
    return {"status": "success"}

# MIDI Events
@router.get("/sequences/{sequence_id}/events/", response_model=List[MIDIEvent])
def read_midi_events(
    sequence_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[MIDIEvent]:
    """Retrieve MIDI events for a sequence."""
    return crud_midi_event.get_multi_by_sequence(
        db, sequence_id=sequence_id, skip=skip, limit=limit
    )

@router.post("/sequences/{sequence_id}/events/", response_model=MIDIEvent)
def create_midi_event(
    *,
    db: Session = Depends(deps.get_db),
    sequence_id: int,
    event_in: MIDIEventCreate
) -> MIDIEvent:
    """Create new MIDI event."""
    return crud_midi_event.create(db, obj_in=event_in)

@router.put("/events/{event_id}", response_model=MIDIEvent)
def update_midi_event(
    *,
    db: Session = Depends(deps.get_db),
    event_id: int,
    event_in: MIDIEventUpdate
) -> MIDIEvent:
    """Update MIDI event."""
    event = crud_midi_event.get(db, id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="MIDI event not found")
    return crud_midi_event.update(db, db_obj=event, obj_in=event_in)

@router.delete("/events/{event_id}")
def delete_midi_event(
    *,
    db: Session = Depends(deps.get_db),
    event_id: int
) -> dict:
    """Delete MIDI event."""
    event = crud_midi_event.get(db, id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="MIDI event not found")
    crud_midi_event.remove(db, id=event_id)
    return {"status": "success"}

# Audio Tracks
@router.get("/tracks/", response_model=List[AudioTrack])
def read_audio_tracks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[AudioTrack]:
    """Retrieve audio tracks."""
    return crud_audio_track.get_multi(db, skip=skip, limit=limit)

@router.post("/tracks/", response_model=AudioTrack)
async def create_audio_track(
    *,
    db: Session = Depends(deps.get_db),
    track_in: AudioTrackCreate,
    file: UploadFile = File(...)
) -> AudioTrack:
    """Create new audio track with file upload."""
    # TODO: Implement file upload handling
    return crud_audio_track.create(db, obj_in=track_in)

@router.get("/tracks/{track_id}", response_model=AudioTrack)
def read_audio_track(
    track_id: int,
    db: Session = Depends(deps.get_db)
) -> AudioTrack:
    """Get specific audio track."""
    track = crud_audio_track.get(db, id=track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Audio track not found")
    return track

@router.put("/tracks/{track_id}", response_model=AudioTrack)
def update_audio_track(
    *,
    db: Session = Depends(deps.get_db),
    track_id: int,
    track_in: AudioTrackUpdate
) -> AudioTrack:
    """Update audio track."""
    track = crud_audio_track.get(db, id=track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Audio track not found")
    return crud_audio_track.update(db, db_obj=track, obj_in=track_in)

@router.delete("/tracks/{track_id}")
def delete_audio_track(
    *,
    db: Session = Depends(deps.get_db),
    track_id: int
) -> dict:
    """Delete audio track."""
    track = crud_audio_track.get(db, id=track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Audio track not found")
    crud_audio_track.remove(db, id=track_id)
    return {"status": "success"}

# Audio Markers
@router.get("/tracks/{track_id}/markers/", response_model=List[AudioMarker])
def read_audio_markers(
    track_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[AudioMarker]:
    """Retrieve markers for an audio track."""
    return crud_audio_marker.get_multi_by_track(
        db, track_id=track_id, skip=skip, limit=limit
    )

@router.post("/tracks/{track_id}/markers/", response_model=AudioMarker)
def create_audio_marker(
    *,
    db: Session = Depends(deps.get_db),
    track_id: int,
    marker_in: AudioMarkerCreate
) -> AudioMarker:
    """Create new audio marker."""
    return crud_audio_marker.create(db, obj_in=marker_in)

@router.put("/markers/{marker_id}", response_model=AudioMarker)
def update_audio_marker(
    *,
    db: Session = Depends(deps.get_db),
    marker_id: int,
    marker_in: AudioMarkerUpdate
) -> AudioMarker:
    """Update audio marker."""
    marker = crud_audio_marker.get(db, id=marker_id)
    if not marker:
        raise HTTPException(status_code=404, detail="Audio marker not found")
    return crud_audio_marker.update(db, db_obj=marker, obj_in=marker_in)

@router.delete("/markers/{marker_id}")
def delete_audio_marker(
    *,
    db: Session = Depends(deps.get_db),
    marker_id: int
) -> dict:
    """Delete audio marker."""
    marker = crud_audio_marker.get(db, id=marker_id)
    if not marker:
        raise HTTPException(status_code=404, detail="Audio marker not found")
    crud_audio_marker.remove(db, id=marker_id)
    return {"status": "success"}

# Audio Automation
@router.get("/tracks/{track_id}/automation/", response_model=List[AudioAutomation])
def read_audio_automation(
    track_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[AudioAutomation]:
    """Retrieve automation for an audio track."""
    return crud_audio_automation.get_multi_by_track(
        db, track_id=track_id, skip=skip, limit=limit
    )

@router.post("/tracks/{track_id}/automation/", response_model=AudioAutomation)
def create_audio_automation(
    *,
    db: Session = Depends(deps.get_db),
    track_id: int,
    automation_in: AudioAutomationCreate
) -> AudioAutomation:
    """Create new audio automation."""
    return crud_audio_automation.create(db, obj_in=automation_in)

@router.put("/automation/{automation_id}", response_model=AudioAutomation)
def update_audio_automation(
    *,
    db: Session = Depends(deps.get_db),
    automation_id: int,
    automation_in: AudioAutomationUpdate
) -> AudioAutomation:
    """Update audio automation."""
    automation = crud_audio_automation.get(db, id=automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail="Audio automation not found")
    return crud_audio_automation.update(db, db_obj=automation, obj_in=automation_in)

@router.delete("/automation/{automation_id}")
def delete_audio_automation(
    *,
    db: Session = Depends(deps.get_db),
    automation_id: int
) -> dict:
    """Delete audio automation."""
    automation = crud_audio_automation.get(db, id=automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail="Audio automation not found")
    crud_audio_automation.remove(db, id=automation_id)
    return {"status": "success"}
