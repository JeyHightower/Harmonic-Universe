from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from uuid import UUID

from database import get_db
from schemas.midi_sequence import MidiSequenceCreate, MidiSequenceResponse, MidiSequenceUpdate
from models.midi_sequence import MidiSequence
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api/midi-sequences",
    tags=["midi-sequences"],
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=MidiSequenceResponse)
def create_midi_sequence(
    midi_sequence: MidiSequenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new MIDI sequence"""
    try:
        db_midi_sequence = MidiSequence(**midi_sequence.dict())
        db.add(db_midi_sequence)
        db.commit()
        db.refresh(db_midi_sequence)
        return db_midi_sequence
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/universe/{universe_id}", response_model=List[MidiSequenceResponse])
def get_midi_sequences_by_universe(
    universe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all MIDI sequences for a universe"""
    sequences = db.query(MidiSequence).filter(MidiSequence.universe_id == universe_id).all()
    return sequences

@router.get("/{sequence_id}", response_model=MidiSequenceResponse)
def get_midi_sequence(
    sequence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific MIDI sequence by ID"""
    sequence = db.query(MidiSequence).filter(MidiSequence.id == sequence_id).first()
    if not sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MIDI sequence not found"
        )
    return sequence

@router.put("/{sequence_id}", response_model=MidiSequenceResponse)
def update_midi_sequence(
    sequence_id: UUID,
    midi_sequence: MidiSequenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a MIDI sequence"""
    db_midi_sequence = db.query(MidiSequence).filter(MidiSequence.id == sequence_id).first()
    if not db_midi_sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MIDI sequence not found"
        )

    # Update the sequence
    for key, value in midi_sequence.dict(exclude_unset=True).items():
        setattr(db_midi_sequence, key, value)

    try:
        db.commit()
        db.refresh(db_midi_sequence)
        return db_midi_sequence
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{sequence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_midi_sequence(
    sequence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a MIDI sequence"""
    db_midi_sequence = db.query(MidiSequence).filter(MidiSequence.id == sequence_id).first()
    if not db_midi_sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MIDI sequence not found"
        )

    try:
        db.delete(db_midi_sequence)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
