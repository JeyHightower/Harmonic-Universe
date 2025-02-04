from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil
from pathlib import Path
import os

from app import crud, models
from app.schemas.audio_file import AudioFile, AudioFileCreate
from app.api import deps
from app.core.audio.processor import AudioProcessor
from app.models.audio.audio_file import AudioFormat, AudioType
from app.core.config import settings

router = APIRouter()

@router.get("/universe/{universe_id}", response_model=List[AudioFile])
def read_audio_files(
    universe_id: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve audio files for a universe.
    """
    universe = crud.universe.get(db=db, id=universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    audio_files = crud.audio_file.get_by_universe(
        db=db, universe_id=universe.id, skip=skip, limit=limit
    )
    return audio_files

@router.post("/upload", response_model=AudioFile)
async def upload_audio_file(
    *,
    db: Session = Depends(deps.get_db),
    universe_id: str = Form(...),
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a new audio file.
    """
    # Check universe permissions
    universe = crud.universe.get(db=db, id=universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR) / "audio" / universe_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save uploaded file
    file_format = Path(file.filename).suffix.lstrip(".").lower()
    if file_format not in [format.value for format in AudioFormat]:
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    file_path = upload_dir / f"{name}{Path(file.filename).suffix}"
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    # Process audio file
    processor = AudioProcessor(str(file_path), AudioFormat(file_format))
    duration = processor.get_duration()
    waveform_data = processor.get_waveform_data()

    # Create audio file record
    audio_file_in = AudioFileCreate(
        name=name,
        description=description,
        format=AudioFormat(file_format),
        type=AudioType.UPLOADED,
        duration=duration,
        file_path=str(file_path),
        file_size=os.path.getsize(file_path),
        universe_id=universe_id,
        waveform_data=waveform_data
    )

    return crud.audio_file.create(db=db, obj_in=audio_file_in)

@router.post("/convert/{id}", response_model=AudioFile)
def convert_audio_file(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    target_format: AudioFormat,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Convert audio file to different format.
    """
    audio_file = crud.audio_file.get(db=db, id=id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Convert file
    processor = AudioProcessor(audio_file.file_path, audio_file.format)
    output_path = processor.convert_format(target_format)

    # Create new audio file record
    audio_file_in = AudioFileCreate(
        name=f"{audio_file.name}_{target_format}",
        description=f"Converted from {audio_file.format}",
        format=target_format,
        type=AudioType.PROCESSED,
        duration=processor.get_duration(),
        file_path=output_path,
        file_size=os.path.getsize(output_path),
        universe_id=audio_file.universe_id,
        waveform_data=processor.get_waveform_data()
    )

    return crud.audio_file.create(db=db, obj_in=audio_file_in)

@router.post("/effects/{id}", response_model=AudioFile)
def apply_audio_effects(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    effects: Dict[str, Any],
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Apply audio effects to file.
    """
    audio_file = crud.audio_file.get(db=db, id=id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Apply effects
    processor = AudioProcessor(audio_file.file_path, audio_file.format)
    processor.apply_effects(effects)

    # Save processed file
    output_path = str(Path(audio_file.file_path).with_stem(f"{audio_file.name}_processed"))
    processor.save(output_path)

    # Create new audio file record
    audio_file_in = AudioFileCreate(
        name=f"{audio_file.name}_processed",
        description=f"Processed with effects: {', '.join(effects.keys())}",
        format=audio_file.format,
        type=AudioType.PROCESSED,
        duration=processor.get_duration(),
        file_path=output_path,
        file_size=os.path.getsize(output_path),
        universe_id=audio_file.universe_id,
        waveform_data=processor.get_waveform_data()
    )

    return crud.audio_file.create(db=db, obj_in=audio_file_in)

@router.get("/{id}", response_model=AudioFile)
def read_audio_file(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get audio file by ID.
    """
    audio_file = crud.audio_file.get(db=db, id=id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return audio_file

@router.delete("/{id}")
def delete_audio_file(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete audio file.
    """
    audio_file = crud.audio_file.get(db=db, id=id)
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found")

    universe = crud.universe.get(db=db, id=audio_file.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Delete physical file
    try:
        os.remove(audio_file.file_path)
    except OSError:
        pass  # Ignore if file doesn't exist

    crud.audio_file.remove(db=db, id=id)
    return {"status": "success"}
