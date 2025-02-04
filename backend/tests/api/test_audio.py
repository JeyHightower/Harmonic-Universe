import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.models.audio_file import AudioFile, AudioFormat, AudioType
from app.core.config import settings
from app.db.session import SessionLocal
from typing import Dict
from fastapi import status
from pathlib import Path
import os

# Create test client
client = TestClient(app)

TEST_FIXTURES_DIR = Path("tests/fixtures")

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

@pytest.fixture
def test_audio(session, test_universe):
    """Create a test audio record."""
    audio = AudioFile(
        name="Test Audio",
        description="Test audio description",
        duration=180,
        format=AudioFormat.MP3,
        type=AudioType.UPLOADED,
        file_path="/test/path/audio.mp3",
        sample_rate=44100,
        channels=2,
        file_size=1024 * 1024,  # 1MB dummy size
        universe_id=test_universe.id
    )
    session.add(audio)
    session.commit()
    session.refresh(audio)
    return audio

def test_get_audio(client, test_audio, auth_headers):
    """Test retrieving a single audio record."""
    response = client.get(f"/api/v1/audio-files/{test_audio.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert str(data["id"]) == str(test_audio.id)
    assert data["name"] == test_audio.name

def test_get_audio_not_found(client, auth_headers):
    """Test retrieving a non-existent audio record."""
    response = client.get("/api/v1/audio-files/999999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_list_audio(client, session, test_universe, test_audio, auth_headers):
    """Test listing all audio records."""
    # Add another audio record
    second_audio = AudioFile(
        name="Second Audio",
        description="Second test audio",
        duration=120,
        format=AudioFormat.MP3,
        type=AudioType.UPLOADED,
        file_path="/test/path/second.mp3",
        sample_rate=44100,
        channels=2,
        file_size=2048 * 1024,  # 2MB dummy size
        universe_id=test_universe.id
    )
    session.add(second_audio)
    session.commit()

    response = client.get(f"/api/v1/audio-files/universe/{test_universe.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) == 2
    assert any(audio["name"] == "Test Audio" for audio in data)
    assert any(audio["name"] == "Second Audio" for audio in data)

def test_update_audio(client, test_audio, auth_headers):
    """Test updating an audio record."""
    update_data = {
        "name": "Updated Audio",
        "description": "Updated description"
    }

    response = client.patch(f"/api/v1/audio-files/{test_audio.id}", json=update_data, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["duration"] == test_audio.duration  # Unchanged field

def test_delete_audio(client, test_audio, auth_headers):
    """Test deleting an audio record."""
    response = client.delete(f"/api/v1/audio-files/{test_audio.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify deletion
    get_response = client.get(f"/api/v1/audio-files/{test_audio.id}", headers=auth_headers)
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

@patch("app.services.media_service.delete_file")
def test_delete_audio_with_file(mock_delete_file, client, test_audio, auth_headers):
    """Test deleting an audio record and its associated file."""
    response = client.delete(f"/api/v1/audio-files/{test_audio.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify file deletion was attempted
    mock_delete_file.assert_called_once_with(test_audio.file_path)

def test_upload_audio(client, auth_headers):
    """Test uploading an audio file."""
    test_file = TEST_FIXTURES_DIR / "test.mp3"
    with open(test_file, "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        response = client.post(
            "/api/audio/upload",
            files=files,
            headers=auth_headers
        )
    assert response.status_code == status.HTTP_201_CREATED
    content = response.json()
    assert "file_id" in content
    assert "url" in content

def test_upload_invalid_file(client, auth_headers):
    """Test uploading an invalid file type."""
    invalid_file = TEST_FIXTURES_DIR / "not_audio.txt"
    with open(invalid_file, "rb") as f:
        files = {"file": ("not_audio.txt", f, "text/plain")}
        response = client.post(
            "/api/audio/upload",
            files=files,
            headers=auth_headers
        )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_get_audio_file(client, auth_headers):
    """Test getting an uploaded audio file."""
    # First upload a file
    test_file = TEST_FIXTURES_DIR / "test.mp3"
    with open(test_file, "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        upload_response = client.post(
            "/api/audio/upload",
            files=files,
            headers=auth_headers
        )
    file_id = upload_response.json()["file_id"]

    # Then try to get it
    response = client.get(f"/api/audio/{file_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "audio/mpeg"

def test_get_nonexistent_audio(client, auth_headers):
    """Test getting a non-existent audio file."""
    response = client.get("/api/audio/nonexistent", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_audio_file(client, auth_headers):
    """Test deleting an audio file."""
    # First upload a file
    test_file = TEST_FIXTURES_DIR / "test.mp3"
    with open(test_file, "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        upload_response = client.post(
            "/api/audio/upload",
            files=files,
            headers=auth_headers
        )
    file_id = upload_response.json()["file_id"]

    # Then delete it
    response = client.delete(f"/api/audio/{file_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's gone
    get_response = client.get(f"/api/audio/{file_id}", headers=auth_headers)
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

def test_unauthorized_audio_access(client):
    """Test unauthorized access to audio endpoints."""
    response = client.get("/api/audio/somefile")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_process_audio(client, auth_headers):
    """Test audio processing endpoint."""
    test_file = TEST_FIXTURES_DIR / "test.mp3"
    with open(test_file, "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        response = client.post(
            "/api/audio/process",
            files=files,
            headers=auth_headers
        )
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "processed_file_url" in content
    assert "duration" in content
    assert "format" in content

def test_search_audio(client, session, test_audio):
    """Test searching for audio records."""
    response = client.get("/api/v1/audio-files/search?q=Test")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == test_audio.name

def test_get_audio_metadata(client, test_audio):
    """Test retrieving audio metadata."""
    response = client.get(f"/api/v1/audio-files/{test_audio.id}/metadata")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["duration"] == test_audio.duration
    assert data["sample_rate"] == test_audio.sample_rate
    assert data["channels"] == test_audio.channels
    assert data["format"] == test_audio.format

def test_batch_delete_audio(client, session, test_universe, auth_headers):
    """Test batch deletion of audio records."""
    # Create multiple test records
    audio_ids = []
    for i in range(3):
        audio = AudioFile(
            name=f"Test Audio {i}",
            description=f"Test audio description {i}",
            duration=180,
            format=AudioFormat.MP3,
            type=AudioType.UPLOADED,
            file_path=f"/test/path/audio_{i}.mp3",
            sample_rate=44100,
            channels=2,
            file_size=1024 * 1024,
            universe_id=test_universe.id
        )
        session.add(audio)
        session.commit()
        audio_ids.append(str(audio.id))

    response = client.post("/api/v1/audio-files/batch-delete", json={"ids": audio_ids}, headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify all records are deleted
    for audio_id in audio_ids:
        get_response = client.get(f"/api/v1/audio-files/{audio_id}", headers=auth_headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

def test_update_audio_metadata(client, test_audio):
    """Test updating audio metadata."""
    metadata = {
        "name": "Updated Title",
        "description": "Updated description",
        "genre": "Updated Genre",
        "year": 2024
    }

    response = client.patch(
        f"/api/v1/audio-files/{test_audio.id}/metadata",
        json=metadata
    )
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["metadata"]["name"] == metadata["name"]
    assert data["metadata"]["genre"] == metadata["genre"]
    assert data["metadata"]["year"] == metadata["year"]
