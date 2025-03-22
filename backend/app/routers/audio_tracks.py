from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from uuid import UUID

from database import get_db
from schemas.audio_track import AudioTrackCreate, AudioTrackResponse, AudioTrackUpdate
from models.audio_track import AudioTrack
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api/audio-tracks",
    tags=["audio-tracks"],
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AudioTrackResponse)
def create_audio_track(
    audio_track: AudioTrackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new audio track"""
    try:
        db_audio_track = AudioTrack(**audio_track.dict())
        db.add(db_audio_track)
        db.commit()
        db.refresh(db_audio_track)
        return db_audio_track
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/universe/{universe_id}", response_model=List[AudioTrackResponse])
def get_audio_tracks_by_universe(
    universe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all audio tracks for a universe"""
    tracks = db.query(AudioTrack).filter(AudioTrack.universe_id == universe_id).all()
    return tracks

@router.get("/{track_id}", response_model=AudioTrackResponse)
def get_audio_track(
    track_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific audio track by ID"""
    track = db.query(AudioTrack).filter(AudioTrack.id == track_id).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio track not found"
        )
    return track

@router.put("/{track_id}", response_model=AudioTrackResponse)
def update_audio_track(
    track_id: UUID,
    audio_track: AudioTrackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an audio track"""
    db_audio_track = db.query(AudioTrack).filter(AudioTrack.id == track_id).first()
    if not db_audio_track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio track not found"
        )

    # Update the track
    for key, value in audio_track.dict(exclude_unset=True).items():
        setattr(db_audio_track, key, value)

    try:
        db.commit()
        db.refresh(db_audio_track)
        return db_audio_track
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audio_track(
    track_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an audio track"""
    db_audio_track = db.query(AudioTrack).filter(AudioTrack.id == track_id).first()
    if not db_audio_track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio track not found"
        )

    try:
        db.delete(db_audio_track)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
