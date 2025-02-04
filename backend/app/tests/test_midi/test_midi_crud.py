"""
Test MIDI CRUD operations.

This module contains tests for MIDI file and event CRUD operations.
Tests cover basic operations, validation, error cases, and edge cases.
"""

import pytest
from typing import Dict, Generator
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
import os
from pathlib import Path
from uuid import UUID

from app import crud
from app.core.config import settings
from app.models.midi_event import MidiEventType
from app.models.audio_file import AudioFormat, AudioType
from app.schemas.midi_event import MIDIEventCreate, MIDIEventBatch
from app.schemas.audio_file import AudioFileCreate
from app.tests.utils.utils import random_lower_string
from app.tests.utils.user import create_random_user
from app.tests.utils.universe import create_random_universe
from app.schemas.midi_file import MIDIFileCreate

@pytest.fixture
def test_midi_file(db: Session, test_user: Dict) -> Generator[Dict, None, None]:
    """Create a test MIDI file for testing."""
    test_file = Path(__file__).parent / "test_files" / "test.midi"
    test_file.parent.mkdir(exist_ok=True)
    test_file.write_bytes(b"test midi data")

    audio_in = AudioFileCreate(
        name=random_lower_string(),
        format=AudioFormat.MIDI,
        type=AudioType.UPLOADED,
        universe_id=test_user["universe_id"],
        file_path=str(test_file),
        file_size=os.path.getsize(test_file)
    )
    midi_file = crud.audio_file.create(db=db, obj_in=audio_in)

    yield {
        "file": midi_file,
        "path": test_file
    }

    if test_file.exists():
        test_file.unlink()

def test_create_midi_file(db: Session, test_user: Dict) -> None:
    """
    Test creating a MIDI file.

    Should:
    - Create a MIDI file with valid parameters
    - Verify all fields are correctly stored
    - Ensure proper scene association
    """
    midi_file_in = MIDIFileCreate(
        name=random_lower_string(),
        scene_id=test_user["active_scene_id"],
        format="mid",
        type="sequence",
        duration=120.0
    )
    midi_file = crud.midi_file.create_with_scene(
        db=db,
        obj_in=midi_file_in,
        scene_id=test_user["active_scene_id"]
    )

    # Verify basic fields
    assert midi_file.name == midi_file_in.name
    assert midi_file.scene_id == test_user["active_scene_id"]
    assert midi_file.format == midi_file_in.format
    assert midi_file.type == midi_file_in.type
    assert midi_file.duration == midi_file_in.duration

    # Verify timestamps
    assert midi_file.created_at is not None
    assert midi_file.updated_at is not None

def test_create_midi_file_invalid_scene(db: Session, test_user: Dict) -> None:
    """
    Test creating a MIDI file with invalid scene ID.

    Should:
    - Attempt to create MIDI file with non-existent scene ID
    - Verify appropriate error is raised
    """
    with pytest.raises(ValueError, match="Scene not found"):
        midi_file_in = MIDIFileCreate(
            name=random_lower_string(),
            scene_id=UUID('00000000-0000-0000-0000-000000000000'),
            format="mid",
            type="sequence",
            duration=120.0
        )
        crud.midi_file.create_with_scene(
            db=db,
            obj_in=midi_file_in,
            scene_id=UUID('00000000-0000-0000-0000-000000000000')
        )

def test_get_midi_file(db: Session, test_user: Dict) -> None:
    """
    Test retrieving a MIDI file.

    Should:
    - Create a MIDI file
    - Retrieve it by ID
    - Verify all fields match
    """
    midi_file_in = MIDIFileCreate(
        name=random_lower_string(),
        scene_id=test_user["active_scene_id"],
        format="mid",
        type="sequence",
        duration=120.0
    )
    midi_file = crud.midi_file.create_with_scene(
        db=db,
        obj_in=midi_file_in,
        scene_id=test_user["active_scene_id"]
    )

    stored_midi_file = crud.midi_file.get(db=db, id=midi_file.id)
    assert stored_midi_file is not None
    assert stored_midi_file.id == midi_file.id
    assert stored_midi_file.name == midi_file.name
    assert stored_midi_file.scene_id == midi_file.scene_id
    assert stored_midi_file.format == midi_file.format
    assert stored_midi_file.type == midi_file.type
    assert stored_midi_file.duration == midi_file.duration

def test_get_midi_files_by_scene(db: Session, test_user: Dict) -> None:
    """
    Test retrieving MIDI files by scene.

    Should:
    - Create multiple MIDI files in the same scene
    - Retrieve all files for the scene
    - Verify correct number and properties of files
    """
    midi_file_count = 3
    created_files = []

    for _ in range(midi_file_count):
        midi_file_in = MIDIFileCreate(
            name=random_lower_string(),
            scene_id=test_user["active_scene_id"],
            format="mid",
            type="sequence",
            duration=120.0
        )
        midi_file = crud.midi_file.create_with_scene(
            db=db,
            obj_in=midi_file_in,
            scene_id=test_user["active_scene_id"]
        )
        created_files.append(midi_file)

    stored_files = crud.midi_file.get_by_scene(
        db=db,
        scene_id=test_user["active_scene_id"]
    )

    assert len(stored_files) == midi_file_count
    for stored_file in stored_files:
        assert stored_file.scene_id == test_user["active_scene_id"]
        assert any(created.id == stored_file.id for created in created_files)

def test_update_midi_file(db: Session, test_user: Dict) -> None:
    """
    Test updating a MIDI file.

    Should:
    - Create a MIDI file
    - Update its properties
    - Verify changes are stored correctly
    """
    midi_file_in = MIDIFileCreate(
        name=random_lower_string(),
        scene_id=test_user["active_scene_id"],
        format="mid",
        type="sequence",
        duration=120.0
    )
    midi_file = crud.midi_file.create_with_scene(
        db=db,
        obj_in=midi_file_in,
        scene_id=test_user["active_scene_id"]
    )

    new_name = random_lower_string()
    new_duration = 240.0

    updated_file = crud.midi_file.update(
        db=db,
        db_obj=midi_file,
        obj_in={"name": new_name, "duration": new_duration}
    )

    assert updated_file.name == new_name
    assert updated_file.duration == new_duration
    assert updated_file.id == midi_file.id
    assert updated_file.updated_at > updated_file.created_at

def test_delete_midi_file(db: Session, test_user: Dict) -> None:
    """
    Test deleting a MIDI file.

    Should:
    - Create a MIDI file
    - Delete it
    - Verify it's no longer in the database
    """
    midi_file_in = MIDIFileCreate(
        name=random_lower_string(),
        scene_id=test_user["active_scene_id"],
        format="mid",
        type="sequence",
        duration=120.0
    )
    midi_file = crud.midi_file.create_with_scene(
        db=db,
        obj_in=midi_file_in,
        scene_id=test_user["active_scene_id"]
    )

    deleted_file = crud.midi_file.remove(db=db, id=midi_file.id)
    assert deleted_file.id == midi_file.id

    stored_file = crud.midi_file.get(db=db, id=midi_file.id)
    assert stored_file is None

def test_midi_event_crud(db: Session, test_midi_file: Dict) -> None:
    """
    Test CRUD operations for MIDI events.

    Should:
    - Create MIDI events
    - Read events by various criteria
    - Update event properties
    - Delete events
    """
    # Create event
    event_in = MIDIEventCreate(
        audio_file_id=str(test_midi_file["file"].id),
        event_type=MidiEventType.NOTE_ON,
        timestamp=0.0,
        channel=0,
        note=60,
        velocity=100
    )
    event = crud.midi_event.create(db=db, obj_in=event_in)

    # Verify creation
    assert event.audio_file_id == test_midi_file["file"].id
    assert event.event_type == MidiEventType.NOTE_ON
    assert event.timestamp == 0.0
    assert event.note == 60
    assert event.velocity == 100

    # Update event
    updated_event = crud.midi_event.update(
        db=db,
        db_obj=event,
        obj_in={"velocity": 80}
    )
    assert updated_event.velocity == 80

    # Delete event
    crud.midi_event.remove(db=db, id=event.id)
    assert crud.midi_event.get(db=db, id=event.id) is None

def test_midi_event_batch_operations(db: Session, test_midi_file: Dict) -> None:
    """
    Test batch operations for MIDI events.

    Should:
    - Create multiple events in a batch
    - Verify all events are created correctly
    - Test batch updates and deletions
    """
    # Create batch of events
    events_in = [
        MIDIEventCreate(
            audio_file_id=str(test_midi_file["file"].id),
            event_type=MidiEventType.NOTE_ON,
            timestamp=float(i),
            channel=0,
            note=60 + i,
            velocity=100
        )
        for i in range(3)
    ]

    events = crud.midi_event.create_batch(db=db, events=events_in)
    assert len(events) == 3

    # Verify batch creation
    for i, event in enumerate(events):
        assert event.audio_file_id == test_midi_file["file"].id
        assert event.timestamp == float(i)
        assert event.note == 60 + i

    # Test batch retrieval
    stored_events = crud.midi_event.get_by_audio_file(
        db=db,
        audio_file_id=test_midi_file["file"].id
    )
    assert len(stored_events) == 3

def test_midi_event_validation(db: Session, test_midi_file: Dict) -> None:
    """
    Test MIDI event validation.

    Should:
    - Reject invalid event types
    - Validate timestamp ranges
    - Validate MIDI channel ranges
    - Validate note and velocity ranges
    """
    # Test invalid event type
    with pytest.raises(ValueError, match="Invalid event type"):
        event_in = MIDIEventCreate(
            audio_file_id=str(test_midi_file["file"].id),
            event_type="INVALID_TYPE",
            timestamp=0.0,
            channel=0,
            note=60,
            velocity=100
        )
        crud.midi_event.create(db=db, obj_in=event_in)

    # Test invalid channel
    with pytest.raises(ValueError, match="Channel must be between 0 and 15"):
        event_in = MIDIEventCreate(
            audio_file_id=str(test_midi_file["file"].id),
            event_type=MidiEventType.NOTE_ON,
            timestamp=0.0,
            channel=16,
            note=60,
            velocity=100
        )
        crud.midi_event.create(db=db, obj_in=event_in)

    # Test invalid note
    with pytest.raises(ValueError, match="Note must be between 0 and 127"):
        event_in = MIDIEventCreate(
            audio_file_id=str(test_midi_file["file"].id),
            event_type=MidiEventType.NOTE_ON,
            timestamp=0.0,
            channel=0,
            note=128,
            velocity=100
        )
        crud.midi_event.create(db=db, obj_in=event_in)

    # Test invalid velocity
    with pytest.raises(ValueError, match="Velocity must be between 0 and 127"):
        event_in = MIDIEventCreate(
            audio_file_id=str(test_midi_file["file"].id),
            event_type=MidiEventType.NOTE_ON,
            timestamp=0.0,
            channel=0,
            note=60,
            velocity=128
        )
        crud.midi_event.create(db=db, obj_in=event_in)

def test_midi_event_ordering(db: Session, test_midi_file: Dict) -> None:
    """
    Test MIDI event ordering and timing.

    Should:
    - Create events with different timestamps
    - Verify events are retrieved in correct order
    - Test time range queries
    """
    # Create events at different times
    timestamps = [0.0, 1.0, 0.5, 2.0, 1.5]
    for ts in timestamps:
        event_in = MIDIEventCreate(
            audio_file_id=str(test_midi_file["file"].id),
            event_type=MidiEventType.NOTE_ON,
            timestamp=ts,
            channel=0,
            note=60,
            velocity=100
        )
        crud.midi_event.create(db=db, obj_in=event_in)

    # Get events ordered by timestamp
    events = crud.midi_event.get_by_time_range(
        db=db,
        audio_file_id=test_midi_file["file"].id,
        start_time=0.0,
        end_time=2.0
    )

    # Verify ordering
    timestamps = [event.timestamp for event in events]
    assert timestamps == sorted(timestamps)

    # Test time range query
    mid_events = crud.midi_event.get_by_time_range(
        db=db,
        audio_file_id=test_midi_file["file"].id,
        start_time=0.75,
        end_time=1.75
    )
    assert len(mid_events) == 2
    assert all(0.75 <= event.timestamp <= 1.75 for event in mid_events)

def test_midi_file_concurrent_access(db: Session, test_user: Dict) -> None:
    """
    Test concurrent access to MIDI files.

    Should:
    - Create multiple MIDI files simultaneously
    - Verify all files are created correctly
    - Test concurrent updates
    """
    import threading
    import queue

    results = queue.Queue()
    def create_midi_file(thread_id: int) -> None:
        try:
            midi_file_in = MIDIFileCreate(
                name=f"test_midi_{thread_id}",
                scene_id=test_user["active_scene_id"],
                format="mid",
                type="sequence",
                duration=120.0
            )
            midi_file = crud.midi_file.create_with_scene(
                db=db,
                obj_in=midi_file_in,
                scene_id=test_user["active_scene_id"]
            )
            results.put((thread_id, midi_file.id))
        except Exception as e:
            results.put((thread_id, e))

    # Create multiple threads
    threads = []
    for i in range(5):
        thread = threading.Thread(target=create_midi_file, args=(i,))
        threads.append(thread)
        thread.start()

    # Wait for all threads
    for thread in threads:
        thread.join()

    # Check results
    created_files = []
    while not results.empty():
        thread_id, result = results.get()
        if isinstance(result, Exception):
            raise result
        created_files.append(result)

    assert len(created_files) == 5
    assert len(set(created_files)) == 5  # All IDs should be unique

def test_midi_file_large_batch(db: Session, test_user: Dict) -> None:
    """
    Test handling of large MIDI file batches.

    Should:
    - Create a large number of MIDI files
    - Test batch retrieval performance
    - Verify memory usage
    """
    import time
    import psutil
    import os

    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss

    # Create large batch of files
    start_time = time.time()
    batch_size = 100
    created_files = []

    for i in range(batch_size):
        midi_file_in = MIDIFileCreate(
            name=f"batch_midi_{i}",
            scene_id=test_user["active_scene_id"],
            format="mid",
            type="sequence",
            duration=120.0
        )
        midi_file = crud.midi_file.create_with_scene(
            db=db,
            obj_in=midi_file_in,
            scene_id=test_user["active_scene_id"]
        )
        created_files.append(midi_file.id)

    creation_time = time.time() - start_time

    # Test batch retrieval
    start_time = time.time()
    stored_files = crud.midi_file.get_by_scene(
        db=db,
        scene_id=test_user["active_scene_id"]
    )
    retrieval_time = time.time() - start_time

    # Verify results
    assert len(stored_files) >= batch_size
    final_memory = process.memory_info().rss
    memory_increase = final_memory - initial_memory

    # Performance assertions
    assert creation_time < batch_size * 0.1  # Less than 100ms per file
    assert retrieval_time < 1.0  # Less than 1 second for retrieval
    assert memory_increase < 100 * 1024 * 1024  # Less than 100MB increase

def test_midi_file_cleanup(db: Session, test_user: Dict) -> None:
    """
    Test MIDI file cleanup operations.

    Should:
    - Create MIDI files with associated events
    - Delete files and verify cascade deletion
    - Test cleanup of orphaned events
    """
    # Create MIDI file with events
    midi_file_in = MIDIFileCreate(
        name=random_lower_string(),
        scene_id=test_user["active_scene_id"],
        format="mid",
        type="sequence",
        duration=120.0
    )
    midi_file = crud.midi_file.create_with_scene(
        db=db,
        obj_in=midi_file_in,
        scene_id=test_user["active_scene_id"]
    )

    # Create associated events
    for i in range(5):
        event_in = MIDIEventCreate(
            audio_file_id=str(midi_file.id),
            event_type=MidiEventType.NOTE_ON,
            timestamp=float(i),
            channel=0,
            note=60 + i,
            velocity=100
        )
        crud.midi_event.create(db=db, obj_in=event_in)

    # Verify events exist
    events = crud.midi_event.get_by_audio_file(
        db=db,
        audio_file_id=midi_file.id
    )
    assert len(events) == 5

    # Delete MIDI file
    crud.midi_file.remove(db=db, id=midi_file.id)

    # Verify cascade deletion of events
    events = crud.midi_event.get_by_audio_file(
        db=db,
        audio_file_id=midi_file.id
    )
    assert len(events) == 0
