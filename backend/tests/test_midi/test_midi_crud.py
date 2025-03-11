import pytest
from flask.testing import FlaskClient
from sqlalchemy.orm import Session
import os
from pathlib import Path

from app import crud, create_app
from app.core.config import settings
from app.models.midi_event import MIDIEventType
from app.models.audio_file import AudioFormat, AudioType
from app.schemas.midi_event import MIDIEventCreate, MIDIEventBatch
from app.schemas.audio_file import AudioFileCreate
from app.tests.utils.utils import random_lower_string
from app.tests.utils.user import create_random_user
from app.tests.utils.universe import create_random_universe


@pytest.fixture
def app():
    """Create test Flask app."""
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


def create_test_midi_file(db: Session, universe_id: str) -> dict:
    """Helper function to create a test MIDI file."""
    test_file = Path(__file__).parent / "test_files" / "test.midi"
    test_file.parent.mkdir(exist_ok=True)
    test_file.write_bytes(b"test midi data")

    audio_in = AudioFileCreate(
        name=random_lower_string(),
        format=AudioFormat.MIDI,
        type=AudioType.UPLOADED,
        universe_id=universe_id,
        file_path=str(test_file),
        file_size=os.path.getsize(test_file),
    )
    return crud.audio_file.create(db=db, obj_in=audio_in)


def test_create_midi_event(
    client: FlaskClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    """Test creating a single MIDI event."""
    user = create_random_user(db)
    universe = create_random_universe(db, creator_id=user.id)
    audio_file = create_test_midi_file(db, universe.id)

    data = {
        "type": MIDIEventType.NOTE_ON.value,
        "timestamp": 1000,
        "note": 60,
        "velocity": 100,
        "audio_file_id": audio_file.id,
    }

    response = client.post(
        f"/api/midi/events", json=data, headers=superuser_token_headers
    )
    assert response.status_code == 200
    content = response.get_json()
    assert content["type"] == MIDIEventType.NOTE_ON.value
    assert content["note"] == 60


def test_create_midi_events_batch(
    client: FlaskClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    """Test creating multiple MIDI events in a batch."""
    user = create_random_user(db)
    universe = create_random_universe(db, creator_id=user.id)
    audio_file = create_test_midi_file(db, universe.id)

    events = [
        {
            "type": MIDIEventType.NOTE_ON.value,
            "timestamp": 1000,
            "note": 60,
            "velocity": 100,
            "audio_file_id": audio_file.id,
        },
        {
            "type": MIDIEventType.NOTE_OFF.value,
            "timestamp": 2000,
            "note": 60,
            "velocity": 0,
            "audio_file_id": audio_file.id,
        },
    ]

    response = client.post(
        f"/api/midi/events/batch",
        json={"events": events},
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.get_json()
    assert len(content) == 2
    assert content[0]["type"] == MIDIEventType.NOTE_ON.value
    assert content[1]["type"] == MIDIEventType.NOTE_OFF.value


def test_get_midi_events_by_audio_file(
    client: FlaskClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db, owner_id=user.id)
    audio_file = create_test_midi_file(db, str(universe.id))

    try:
        # Create test events
        events_in = [
            MIDIEventCreate(
                audio_file_id=str(audio_file.id),
                event_type=MIDIEventType.NOTE_ON,
                timestamp=float(i),
                channel=0,
                note=60 + i,
                velocity=100,
            )
            for i in range(3)
        ]
        created_events = crud.midi_event.create_batch(db=db, events=events_in)

        # Get events by audio file
        stored_events = crud.midi_event.get_by_audio_file(
            db=db, audio_file_id=audio_file.id
        )

        assert len(stored_events) == len(created_events)
        for stored, created in zip(stored_events, created_events):
            assert stored.id == created.id
            assert stored.timestamp == created.timestamp
            assert stored.note == created.note

    finally:
        if Path(audio_file.file_path).exists():
            Path(audio_file.file_path).unlink()


def test_get_midi_events_by_type(
    client: FlaskClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db, owner_id=user.id)
    audio_file = create_test_midi_file(db, str(universe.id))

    try:
        # Create events with different types
        events_in = [
            MIDIEventCreate(
                audio_file_id=str(audio_file.id),
                event_type=MIDIEventType.NOTE_ON,
                timestamp=0.0,
                channel=0,
                note=60,
                velocity=100,
            ),
            MIDIEventCreate(
                audio_file_id=str(audio_file.id),
                event_type=MIDIEventType.NOTE_OFF,
                timestamp=1.0,
                channel=0,
                note=60,
                velocity=0,
            ),
        ]
        crud.midi_event.create_batch(db=db, events=events_in)

        # Get events by type
        note_on_events = crud.midi_event.get_by_type(
            db=db, audio_file_id=audio_file.id, event_type=MIDIEventType.NOTE_ON
        )

        assert len(note_on_events) == 1
        assert note_on_events[0].event_type == MIDIEventType.NOTE_ON

    finally:
        if Path(audio_file.file_path).exists():
            Path(audio_file.file_path).unlink()


def test_get_midi_events_by_time_range(
    client: FlaskClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db, owner_id=user.id)
    audio_file = create_test_midi_file(db, str(universe.id))

    try:
        # Create events at different times
        events_in = [
            MIDIEventCreate(
                audio_file_id=str(audio_file.id),
                event_type=MIDIEventType.NOTE_ON,
                timestamp=float(i),
                channel=0,
                note=60,
                velocity=100,
            )
            for i in range(5)
        ]
        crud.midi_event.create_batch(db=db, events=events_in)

        # Get events in time range
        events = crud.midi_event.get_by_time_range(
            db=db, audio_file_id=audio_file.id, start_time=1.5, end_time=3.5
        )

        assert len(events) == 2  # Should get events at t=2 and t=3
        for event in events:
            assert 1.5 <= event.timestamp <= 3.5

    finally:
        if Path(audio_file.file_path).exists():
            Path(audio_file.file_path).unlink()


def test_delete_midi_event(
    client: FlaskClient,
    db: Session,
    superuser_token_headers: dict,
) -> None:
    user = create_random_user(db)
    universe = create_random_universe(db, owner_id=user.id)
    audio_file = create_test_midi_file(db, str(universe.id))

    try:
        event_in = MIDIEventCreate(
            audio_file_id=str(audio_file.id),
            event_type=MIDIEventType.NOTE_ON,
            timestamp=0.0,
            channel=0,
            note=60,
            velocity=100,
        )
        event = crud.midi_event.create(db=db, obj_in=event_in)

        # Delete event
        crud.midi_event.remove(db=db, id=event.id)

        stored_event = crud.midi_event.get(db=db, id=event.id)
        assert stored_event is None

    finally:
        if Path(audio_file.file_path).exists():
            Path(audio_file.file_path).unlink()
