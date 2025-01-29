import pytest
from app.models.note import Note
from sqlalchemy.exc import IntegrityError

def test_new_note(session, test_universe):
    """Test creating a new note"""
    note = Note(
        title="Test Note",
        content="Test note content",
        universe_id=test_universe.id
    )
    session.add(note)
    session.commit()

    assert note.title == "Test Note"
    assert note.content == "Test note content"
    assert note.universe_id == test_universe.id
    assert note.universe == test_universe
    assert note in test_universe.notes

def test_note_to_dict(session, test_note):
    """Test converting a note to dictionary"""
    note_dict = test_note.to_dict()

    assert note_dict["title"] == "Test Note"
    assert note_dict["content"] == "Test note content"
    assert note_dict["universe_id"] == test_note.universe_id

def test_note_validation(session, test_universe):
    """Test note validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        note = Note(content="Missing title")
        session.add(note)
        session.commit()
    session.rollback()

    # Test duplicate title in same universe
    note1 = Note(
        title="Same Title",
        content="First note content",
        universe_id=test_universe.id
    )
    session.add(note1)
    session.commit()

    with pytest.raises(IntegrityError):
        note2 = Note(
            title="Same Title",
            content="Second note content",
            universe_id=test_universe.id
        )
        session.add(note2)
        session.commit()
    session.rollback()

def test_note_relationships(session, test_universe, test_note):
    """Test note relationships"""
    # Test universe relationship
    assert test_note.universe == test_universe
    assert test_note in test_universe.notes

    # Test cascade delete
    session.delete(test_universe)
    session.commit()

    # Note should be deleted when universe is deleted
    assert session.query(Note).filter_by(id=test_note.id).first() is None

def test_note_tags(session, test_note):
    """Test note tags management"""
    # Add tags
    test_note.tags = ["important", "plot", "character-development"]
    session.commit()

    # Test tags retrieval
    assert "important" in test_note.tags
    assert "plot" in test_note.tags
    assert len(test_note.tags) == 3

    # Test adding a tag
    test_note.tags.append("mystery")
    session.commit()
    assert "mystery" in test_note.tags
    assert len(test_note.tags) == 4

    # Test removing a tag
    test_note.tags.remove("plot")
    session.commit()
    assert "plot" not in test_note.tags
    assert len(test_note.tags) == 3

def test_note_linked_entities(session, test_note, test_character, test_location):
    """Test note linked entities management"""
    # Link entities to note
    test_note.linked_characters.append(test_character)
    test_note.linked_locations.append(test_location)
    session.commit()

    # Test linked entities retrieval
    assert test_character in test_note.linked_characters
    assert test_location in test_note.linked_locations

    # Test unlinking entities
    test_note.linked_characters.remove(test_character)
    session.commit()
    assert test_character not in test_note.linked_characters
    assert test_location in test_note.linked_locations
