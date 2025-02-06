"""
Test audio file API endpoints.
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import status
from pathlib import Path
import os

from app.models.audio.audio_file import AudioFile, AudioFormat, AudioType

TEST_FIXTURES_DIR = Path("tests/fixtures")

@pytest.fixture(autouse=True)
def setup_test_fixtures():
    """Create test fixtures directory if it doesn't exist."""
    TEST_FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    yield
    # Cleanup any leftover test files
    if TEST_FIXTURES_DIR.exists():
        for file in TEST_FIXTURES_DIR.glob("*"):
            if file.is_file():
                file.unlink()

@pytest.fixture
def test_audio(session, test_universe):
    """Create a test audio record."""
    audio = AudioFile(
        name="Test Audio",
        description="Test audio description",
        duration=180,
        format=AudioFormat.WAV,
        type=AudioType.UPLOADED,
        file_path="/test/path/audio.wav",
        sample_rate=44100,
        channels=2,
        file_size=1024 * 512,  # 512KB dummy size
        universe_id=test_universe.id
    )
    session.add(audio)
    session.commit()
    session.refresh(audio)
    return audio

def test_create_audio(client, session, test_universe, auth_headers):
    """Test creating a new audio record."""
    audio_data = {
        "name": "New Audio",
        "description": "Test audio file",
        "duration": 240,
        "format": "wav",
        "file_path": "/test/path/new.wav",
        "sample_rate": 48000,
        "channels": 2,
        "file_size": 1024 * 1024,  # 1MB dummy size
        "universe_id": str(test_universe.id)
    }

    response = client.post("/api/v1/audio-files/", json=audio_data, headers=auth_headers)
    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()
    assert data["name"] == audio_data["name"]
    assert data["description"] == audio_data["description"]

    # Verify database record
    db_audio = session.query(AudioFile).filter(AudioFile.id == data["id"]).first()
    assert db_audio is not None
    assert db_audio.name == audio_data["name"]

def test_get_audio(client, test_audio, auth_headers):
    """Test retrieving a single audio record."""
    response = client.get(f"/api/v1/audio-files/{test_audio.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == test_audio.name
    assert data["description"] == test_audio.description

def test_get_audio_not_found(client, auth_headers):
    """Test retrieving a non-existent audio record."""
    response = client.get("/api/v1/audio-files/999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_list_audio(client, session, test_universe, test_audio, auth_headers):
    """Test listing audio records."""
    # Create additional test records
    for i in range(3):
        audio = AudioFile(
            name=f"Test Audio {i}",
            description=f"Test description {i}",
            duration=180,
            format=AudioFormat.WAV,
            type=AudioType.UPLOADED,
            file_path=f"/test/path/audio_{i}.wav",
            sample_rate=44100,
            channels=2,
            file_size=1024 * 512,
            universe_id=test_universe.id
        )
        session.add(audio)
    session.commit()

    response = client.get("/api/v1/audio-files/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 4  # Original test_audio plus 3 new records

def test_update_audio(client, test_audio, auth_headers):
    """Test updating an audio record."""
    update_data = {
        "name": "Updated Audio",
        "description": "Updated description"
    }
    response = client.put(
        f"/api/v1/audio-files/{test_audio.id}",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]

def test_delete_audio(client, test_audio, auth_headers):
    """Test deleting an audio record."""
    response = client.delete(
        f"/api/v1/audio-files/{test_audio.id}",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

@patch("app.services.media_service.delete_file")
def test_delete_audio_with_file(mock_delete_file, client, test_audio, auth_headers):
    """Test deleting an audio record with associated file."""
    response = client.delete(
        f"/api/v1/audio-files/{test_audio.id}",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_delete_file.assert_called_once_with(test_audio.file_path)

def test_upload_audio(client, auth_headers):
    """Test uploading an audio file."""
    # Create a temporary test file
    test_file_path = TEST_FIXTURES_DIR / "test_upload.wav"
    test_file_path.parent.mkdir(exist_ok=True)
    test_file_path.write_bytes(b"test audio content")

    try:
        with open(test_file_path, "rb") as f:
            response = client.post(
                "/api/v1/audio-files/upload",
                files={"file": ("test_upload.wav", f, "audio/wav")},
                headers=auth_headers
            )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "test_upload"
        assert data["format"] == "WAV"
    finally:
        if test_file_path.exists():
            test_file_path.unlink()

def test_upload_invalid_file(client, auth_headers):
    """Test uploading an invalid file type."""
    # Create a temporary test file
    test_file_path = TEST_FIXTURES_DIR / "test_invalid.txt"
    test_file_path.parent.mkdir(exist_ok=True)
    test_file_path.write_bytes(b"not an audio file")

    try:
        with open(test_file_path, "rb") as f:
            response = client.post(
                "/api/v1/audio-files/upload",
                files={"file": ("test_invalid.txt", f, "text/plain")},
                headers=auth_headers
            )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    finally:
        if test_file_path.exists():
            test_file_path.unlink()

def test_get_audio_file(client, auth_headers):
    """Test downloading an audio file."""
    # Create a temporary test file
    test_file_path = TEST_FIXTURES_DIR / "test_download.wav"
    test_file_path.parent.mkdir(exist_ok=True)
    test_file_path.write_bytes(b"test audio content")

    try:
        response = client.get(
            f"/api/v1/audio-files/download/{test_file_path.name}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "audio/wav"
        assert response.content == b"test audio content"
    finally:
        if test_file_path.exists():
            test_file_path.unlink()

def test_get_nonexistent_audio(client, auth_headers):
    """Test downloading a non-existent audio file."""
    response = client.get(
        "/api/v1/audio-files/download/nonexistent.wav",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_audio_file(client, auth_headers):
    """Test deleting an audio file."""
    # Create a temporary test file
    test_file_path = TEST_FIXTURES_DIR / "test_delete.wav"
    test_file_path.parent.mkdir(exist_ok=True)
    test_file_path.write_bytes(b"test audio content")

    try:
        response = client.delete(
            f"/api/v1/audio-files/file/{test_file_path.name}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not test_file_path.exists()
    finally:
        if test_file_path.exists():
            test_file_path.unlink()

def test_unauthorized_audio_access(client):
    """Test accessing audio endpoints without authentication."""
    response = client.get("/api/v1/audio-files/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_process_audio(client, auth_headers):
    """Test audio processing endpoint."""
    # Create a temporary test file
    test_file_path = TEST_FIXTURES_DIR / "test_process.wav"
    test_file_path.parent.mkdir(exist_ok=True)
    test_file_path.write_bytes(b"test audio content")

    try:
        with open(test_file_path, "rb") as f:
            response = client.post(
                "/api/v1/audio-files/process",
                files={"file": ("test_process.wav", f, "audio/wav")},
                headers=auth_headers
            )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "duration" in data
        assert "sample_rate" in data
        assert "channels" in data
    finally:
        if test_file_path.exists():
            test_file_path.unlink()

def test_search_audio(client, session, test_audio):
    """Test searching audio files."""
    response = client.get("/api/v1/audio-files/search?q=test")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) > 0
    assert any(audio["name"] == test_audio.name for audio in data)

def test_get_audio_metadata(client, test_audio):
    """Test retrieving audio metadata."""
    response = client.get(f"/api/v1/audio-files/{test_audio.id}/metadata")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "format" in data
    assert "sample_rate" in data
    assert "channels" in data
    assert "duration" in data

def test_batch_delete_audio(client, session, test_universe, auth_headers):
    """Test batch deletion of audio files."""
    # Create test audio files
    audio_ids = []
    for i in range(3):
        audio = AudioFile(
            name=f"Test Audio {i}",
            description=f"Test description {i}",
            duration=180,
            format=AudioFormat.WAV,
            type=AudioType.UPLOADED,
            file_path=f"/test/path/audio_{i}.wav",
            sample_rate=44100,
            channels=2,
            file_size=1024 * 512,
            universe_id=test_universe.id
        )
        session.add(audio)
        session.commit()
        session.refresh(audio)
        audio_ids.append(str(audio.id))

    response = client.post(
        "/api/v1/audio-files/batch-delete",
        json={"ids": audio_ids},
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify deletion
    for audio_id in audio_ids:
        audio = session.query(AudioFile).filter(AudioFile.id == audio_id).first()
        assert audio is None

def test_update_audio_metadata(client, test_audio):
    """Test updating audio metadata."""
    metadata = {
        "key": "value",
        "nested": {
            "key": "value"
        }
    }
    response = client.put(
        f"/api/v1/audio-files/{test_audio.id}/metadata",
        json=metadata
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["audio_metadata"] == metadata
