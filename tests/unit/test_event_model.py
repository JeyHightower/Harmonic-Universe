import pytest
from app.models.event import Event
from sqlalchemy.exc import IntegrityError
from datetime import datetime

def test_new_event(session, test_universe):
    """Test creating a new event"""
    event = Event(
        title="Test Event",
        description="A test event",
        universe_id=test_universe.id,
        date=datetime(2024, 1, 1)
    )
    session.add(event)
    session.commit()

    assert event.title == "Test Event"
    assert event.description == "A test event"
    assert event.universe_id == test_universe.id
    assert event.universe == test_universe
    assert event in test_universe.events
    assert event.date == datetime(2024, 1, 1)

def test_event_to_dict(session, test_event):
    """Test converting an event to dictionary"""
    event_dict = test_event.to_dict()

    assert event_dict["title"] == "Test Event"
    assert event_dict["description"] == "A test event"
    assert event_dict["universe_id"] == test_event.universe_id
    assert isinstance(event_dict["date"], str)  # Date should be serialized to string

def test_event_validation(session, test_universe):
    """Test event validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        event = Event(description="Missing title")
        session.add(event)
        session.commit()
    session.rollback()

    # Test duplicate title in same universe
    event1 = Event(
        title="Same Title",
        description="First event",
        universe_id=test_universe.id,
        date=datetime(2024, 1, 1)
    )
    session.add(event1)
    session.commit()

    with pytest.raises(IntegrityError):
        event2 = Event(
            title="Same Title",
            description="Second event",
            universe_id=test_universe.id,
            date=datetime(2024, 1, 2)
        )
        session.add(event2)
        session.commit()
    session.rollback()

def test_event_relationships(session, test_universe, test_event):
    """Test event relationships"""
    # Test universe relationship
    assert test_event.universe == test_universe
    assert test_event in test_universe.events

    # Test cascade delete
    session.delete(test_universe)
    session.commit()

    # Event should be deleted when universe is deleted
    assert session.query(Event).filter_by(id=test_event.id).first() is None

def test_event_participants(session, test_event, test_character, test_location):
    """Test event participants management"""
    # Add participants to event
    test_event.participating_characters.append(test_character)
    test_event.locations.append(test_location)
    session.commit()

    # Test participants retrieval
    assert test_character in test_event.participating_characters
    assert test_location in test_event.locations

    # Test removing participants
    test_event.participating_characters.remove(test_character)
    session.commit()
    assert test_character not in test_event.participating_characters
    assert test_location in test_event.locations

def test_event_timeline(session, test_universe):
    """Test event timeline ordering"""
    # Create multiple events with different dates
    event1 = Event(
        title="Past Event",
        description="An event in the past",
        universe_id=test_universe.id,
        date=datetime(2023, 1, 1)
    )
    event2 = Event(
        title="Present Event",
        description="An event in the present",
        universe_id=test_universe.id,
        date=datetime(2024, 1, 1)
    )
    event3 = Event(
        title="Future Event",
        description="An event in the future",
        universe_id=test_universe.id,
        date=datetime(2025, 1, 1)
    )

    session.add_all([event1, event2, event3])
    session.commit()

    # Test chronological ordering
    events = test_universe.events.order_by(Event.date).all()
    assert len(events) == 3
    assert events[0].title == "Past Event"
    assert events[1].title == "Present Event"
    assert events[2].title == "Future Event"
