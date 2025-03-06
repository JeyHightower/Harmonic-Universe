from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from uuid import UUID
import os
import shutil
from pathlib import Path

from database import get_db
from schemas.audio_file import AudioFileCreate, AudioFileResponse, AudioFileUpdate
from models.audio_file import AudioFile
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api/audio-files",
    tags=["audio-files"],
)

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads/audio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AudioFileResponse)
async def upload_audio_file(
    file: UploadFile = File(...),
    name: str = Form(...),
    universe_id: Optional[UUID] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new audio file"""
    # Validate file type
    if not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file"
        )

    # Create unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{current_user.id}_{uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )

    # Create database record
    try:
        db_audio_file = AudioFile(
            name=name,
            file_path=str(file_path),
            format=file.content_type,
            user_id=current_user.id,
            universe_id=universe_id
        )
        db.add(db_audio_file)
        db.commit()
        db.refresh(db_audio_file)
        return db_audio_file
    except SQLAlchemyError as e:
        # Delete the file if database operation fails
        os.remove(file_path)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/user", response_model=List[AudioFileResponse])
def get_user_audio_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all audio files uploaded by the current user"""
    audio_files = db.query(AudioFile).filter(AudioFile.user_id == current_user.id).all()
    return audio_files

@router.get("/universe/{universe_id}", response_model=List[AudioFileResponse])
def get_universe_audio_files(
    universe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all audio files for a universe"""
    audio_files = db.query(AudioFile).filter(AudioFile.universe_id == universe_id).all()
    return audio_files

@router.get("/{file_id}", response_model=AudioFileResponse)
def get_audio_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific audio file by ID"""
    audio_file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not audio_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    return audio_file

@router.put("/{file_id}", response_model=AudioFileResponse)
def update_audio_file(
    file_id: UUID,
    audio_file_update: AudioFileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update audio file metadata"""
    db_audio_file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not db_audio_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )

    # Check ownership
    if db_audio_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this file"
        )

    # Update the file metadata
    for key, value in audio_file_update.dict(exclude_unset=True).items():
        setattr(db_audio_file, key, value)

    try:
        db.commit()
        db.refresh(db_audio_file)
        return db_audio_file
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audio_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an audio file"""
    db_audio_file = db.query(AudioFile).filter(AudioFile.id == file_id).first()
    if not db_audio_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )

    # Check ownership
    if db_audio_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this file"
        )

    # Delete the file and record
    try:
        if os.path.exists(db_audio_file.file_path):
            os.remove(db_audio_file.file_path)
        db.delete(db_audio_file)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting file: {str(e)}"
        )
