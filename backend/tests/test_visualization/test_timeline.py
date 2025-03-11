import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock
import json

from app.core.visualization.timeline import TimelineManager
from app.models.visualization import Timeline, Keyframe, Animation

@pytest.fixture
def timeline_data():
    """Create test timeline data."""
    return {
        "duration": 10.0,
        "fps": 60,
        "markers": [
            {
                "id": "marker1",
                "time": 1.0,
                "type": "cue",
                "metadata": {"name": "First Marker"}
            },
            {
                "id": "marker2",
                "time": 5.0,
                "type": "sync",
                "metadata": {"name": "Middle Marker"}
            }
        ],
        "keyframes": [
            {
                "id": "kf1",
                "animation_id": "anim1",
                "property_name": "position.x",
                "time": 0.0,
                "value": 0.0,
                "easing": "linear"
            },
            {
                "id": "kf2",
                "animation_id": "anim1",
                "property_name": "position.x",
                "time": 5.0,
                "value": 10.0,
                "easing": "ease-in-out"
            }
        ]
    }

@pytest.fixture
def timeline_manager(timeline_data):
    """Create test timeline manager."""
    return TimelineManager(timeline_data)

@pytest.mark.asyncio
async def test_timeline_initialization(timeline_manager, timeline_data):
    """Test timeline manager initialization."""
    assert timeline_manager.duration == timeline_data["duration"]
    assert timeline_manager.fps == timeline_data["fps"]
    assert not timeline_manager.is_playing
    assert not timeline_manager.is_looping
    assert timeline_manager.current_time == 0.0
    assert len(timeline_manager._sorted_markers) == 2
    assert len(timeline_manager._keyframes) == 1  # One animated property

@pytest.mark.asyncio
async def test_playback_control(timeline_manager):
    """Test timeline playback controls."""
    # Start playback
    await timeline_manager.start()
    assert timeline_manager.is_playing

    # Let it run for a short time
    await asyncio.sleep(0.1)
    assert timeline_manager.current_time > 0

    # Pause playback
    await timeline_manager.pause()
    assert not timeline_manager.is_playing
    current_time = timeline_manager.current_time

    # Wait and verify time is paused
    await asyncio.sleep(0.1)
    assert timeline_manager.current_time == current_time

    # Stop playback
    await timeline_manager.stop()
    assert not timeline_manager.is_playing
    assert timeline_manager.current_time == 0.0

@pytest.mark.asyncio
async def test_seek(timeline_manager):
    """Test seeking to specific time."""
    # Seek to middle
    await timeline_manager.seek(5.0)
    assert timeline_manager.current_time == 5.0

    # Seek past end
    await timeline_manager.seek(15.0)
    assert timeline_manager.current_time == timeline_manager.duration

    # Seek before start
    await timeline_manager.seek(-1.0)
    assert timeline_manager.current_time == 0.0

@pytest.mark.asyncio
async def test_frame_callbacks(timeline_manager):
    """Test frame update callbacks."""
    callback_frames = []

    async def frame_callback(frame_data):
        callback_frames.append(frame_data)

    timeline_manager.add_frame_callback(frame_callback)

    # Run for a few frames
    timeline_manager.is_playing = True
    for _ in range(3):
        await timeline_manager._process_frame()

    assert len(callback_frames) == 3
    for frame in callback_frames:
        assert "time" in frame
        assert "properties" in frame

@pytest.mark.asyncio
async def test_marker_callbacks(timeline_manager):
    """Test marker event callbacks."""
    marker_events = []

    async def marker_callback(marker):
        marker_events.append(marker)

    # Add callback for first marker
    timeline_manager.add_marker_callback("marker1", marker_callback)

    # Seek to just before first marker
    await timeline_manager.seek(0.99)
    await timeline_manager._check_markers()
    assert len(marker_events) == 0

    # Seek to first marker
    await timeline_manager.seek(1.0)
    await timeline_manager._check_markers()
    assert len(marker_events) == 1
    assert marker_events[0]["id"] == "marker1"

@pytest.mark.asyncio
async def test_keyframe_interpolation(timeline_manager):
    """Test keyframe value interpolation."""
    # Test linear interpolation
    frame_state = timeline_manager._calculate_frame_state()
    assert "anim1:position.x" in frame_state["properties"]

    # Test at start
    await timeline_manager.seek(0.0)
    frame_state = timeline_manager._calculate_frame_state()
    assert frame_state["properties"]["anim1:position.x"] == 0.0

    # Test at middle
    await timeline_manager.seek(2.5)
    frame_state = timeline_manager._calculate_frame_state()
    assert frame_state["properties"]["anim1:position.x"] == 5.0

    # Test at end
    await timeline_manager.seek(5.0)
    frame_state = timeline_manager._calculate_frame_state()
    assert frame_state["properties"]["anim1:position.x"] == 10.0

@pytest.mark.asyncio
async def test_easing_functions(timeline_manager):
    """Test different easing functions."""
    test_cases = [
        ("linear", 0.5, 0.5),
        ("ease-in", 0.5, 0.25),
        ("ease-out", 0.5, 0.75),
        ("ease-in-out", 0.5, 0.5)
    ]

    for easing, t, expected in test_cases:
        value = timeline_manager._interpolate_number(0, 1, t, easing)
        assert value == pytest.approx(expected, rel=1e-2)

@pytest.mark.asyncio
async def test_looping_playback(timeline_manager):
    """Test looping playback behavior."""
    timeline_manager.is_looping = True

    # Seek near end
    await timeline_manager.seek(9.9)
    assert timeline_manager.current_time == 9.9

    # Update should loop back to start
    timeline_manager.is_playing = True
    await timeline_manager._update()
    assert timeline_manager.current_time < timeline_manager.duration
