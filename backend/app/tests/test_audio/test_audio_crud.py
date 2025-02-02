import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import os
from pathlib import Path

from app import crud
from app.core.config import settings
from app.models.audio_file import AudioFormat, AudioType
from app.schemas.audio_file import AudioFileCreateSchema
from app.tests.utils.utils import random_lower_string
from app.tests.utils.user import create_random_user
from app.tests.utils.universe import create_random_universe

def test_create_audio_file(
    client: TestClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db)

    # Create test audio file
    test_file = Path(__file__).parent / "test_files" / "test_audio.wav"
    test_file.parent.mkdir(exist_ok=True)
    test_file.write_bytes(b"test audio data")

    try:
        name = random_lower_string()
        file_data = {
            "name": name,
            "description": "Test audio file",
            "format": AudioFormat.WAV,
            "type": AudioType.UPLOADED,
            "universe_id": str(universe.id),
            "file_path": str(test_file),
            "file_size": os.path.getsize(test_file)
        }

        audio_in = AudioFileCreateSchema(**file_data)
        audio = crud.audio_file.create(db=db, obj_in=audio_in)

        assert audio.name == name
        assert audio.format == AudioFormat.WAV
        assert audio.universe_id == universe.id
        assert os.path.exists(audio.file_path)

    finally:
        if test_file.exists():
            test_file.unlink()

def test_get_audio_file(
    client: TestClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db)

    # Create test audio file
    test_file = Path(__file__).parent / "test_files" / "test_audio.wav"
    test_file.parent.mkdir(exist_ok=True)
    test_file.write_bytes(b"test audio data")

    try:
        audio_in = AudioFileCreateSchema(
            name=random_lower_string(),
            format=AudioFormat.WAV,
            type=AudioType.UPLOADED,
            universe_id=str(universe.id),
            file_path=str(test_file),
            file_size=os.path.getsize(test_file)
        )
        audio = crud.audio_file.create(db=db, obj_in=audio_in)

        stored_audio = crud.audio_file.get(db=db, id=audio.id)
        assert stored_audio
        assert stored_audio.name == audio.name
        assert stored_audio.format == audio.format
        assert stored_audio.universe_id == audio.universe_id

    finally:
        if test_file.exists():
            test_file.unlink()

def test_get_audio_files_by_universe(
    client: TestClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db)

    # Create multiple test audio files
    test_files = []
    for i in range(3):
        test_file = Path(__file__).parent / "test_files" / f"test_audio_{i}.wav"
        test_file.parent.mkdir(exist_ok=True)
        test_file.write_bytes(b"test audio data")
        test_files.append(test_file)

    try:
        # Create audio files in database
        created_files = []
        for test_file in test_files:
            audio_in = AudioFileCreateSchema(
                name=random_lower_string(),
                format=AudioFormat.WAV,
                type=AudioType.UPLOADED,
                universe_id=str(universe.id),
                file_path=str(test_file),
                file_size=os.path.getsize(test_file)
            )
            audio = crud.audio_file.create(db=db, obj_in=audio_in)
            created_files.append(audio)

        # Get audio files by universe
        stored_files = crud.audio_file.get_by_universe(
            db=db, universe_id=universe.id
        )
        assert len(stored_files) == len(created_files)
        for stored, created in zip(stored_files, created_files):
            assert stored.id == created.id
            assert stored.name == created.name

    finally:
        for test_file in test_files:
            if test_file.exists():
                test_file.unlink()

def test_delete_audio_file(
    client: TestClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db)

    # Create test audio file
    test_file = Path(__file__).parent / "test_files" / "test_audio.wav"
    test_file.parent.mkdir(exist_ok=True)
    test_file.write_bytes(b"test audio data")

    try:
        audio_in = AudioFileCreateSchema(
            name=random_lower_string(),
            format=AudioFormat.WAV,
            type=AudioType.UPLOADED,
            universe_id=str(universe.id),
            file_path=str(test_file),
            file_size=os.path.getsize(test_file)
        )
        audio = crud.audio_file.create(db=db, obj_in=audio_in)

        # Delete audio file
        crud.audio_file.remove(db=db, id=audio.id)

        stored_audio = crud.audio_file.get(db=db, id=audio.id)
        assert stored_audio is None
        assert not os.path.exists(test_file)

    finally:
        if test_file.exists():
            test_file.unlink()
