import pytest
from app.models.character import Character
from app.models.relationship import Relationship
from sqlalchemy.exc import IntegrityError

def test_new_character(session, test_universe):
    """Test creating a new character"""
    character = Character(
        name="Test Character",
        description="A test character",
        universe_id=test_universe.id
    )
    session.add(character)
    session.commit()

    assert character.name == "Test Character"
    assert character.description == "A test character"
    assert character.universe_id == test_universe.id
    assert character.universe == test_universe
    assert character in test_universe.characters

def test_character_to_dict(session, test_character):
    """Test converting a character to dictionary"""
    character_dict = test_character.to_dict()

    assert character_dict["name"] == "Test Character"
    assert character_dict["description"] == "A test character"
    assert character_dict["universe_id"] == test_character.universe_id

def test_character_validation(session, test_universe):
    """Test character validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        character = Character(description="Missing name")
        session.add(character)
        session.commit()
    session.rollback()

    # Test duplicate name in same universe
    character1 = Character(
        name="Same Name",
        description="First character",
        universe_id=test_universe.id
    )
    session.add(character1)
    session.commit()

    with pytest.raises(IntegrityError):
        character2 = Character(
            name="Same Name",
            description="Second character",
            universe_id=test_universe.id
        )
        session.add(character2)
        session.commit()
    session.rollback()

def test_character_relationships(session, test_universe, test_character):
    """Test character relationships"""
    # Test universe relationship
    assert test_character.universe == test_universe
    assert test_character in test_universe.characters

    # Test cascade delete
    session.delete(test_universe)
    session.commit()

    # Character should be deleted when universe is deleted
    assert session.query(Character).filter_by(id=test_character.id).first() is None

def test_character_relationship_management(session, test_character):
    """Test managing relationships between characters"""
    # Create another character for relationship testing
    other_character = Character(
        name="Other Character",
        description="Another test character",
        universe_id=test_character.universe_id
    )
    session.add(other_character)
    session.commit()

    # Create a relationship between characters
    relationship = Relationship(
        name="Test Relationship",
        description="A test relationship",
        character_id=test_character.id,
        related_character_id=other_character.id,
        relationship_type="friend"
    )
    session.add(relationship)
    session.commit()

    # Test relationship retrieval
    assert relationship in test_character.relationships
    assert relationship.character == test_character
    assert relationship.related_character == other_character

    # Test relationship deletion
    session.delete(relationship)
    session.commit()

    assert len(test_character.relationships.all()) == 0

def test_character_attributes(session, test_character):
    """Test character attributes management"""
    # Add character attributes
    test_character.attributes = {
        "age": 25,
        "height": "6'0\"",
        "weight": "180 lbs",
        "eye_color": "blue",
        "hair_color": "brown"
    }
    session.commit()

    # Test attribute retrieval
    assert test_character.attributes["age"] == 25
    assert test_character.attributes["height"] == "6'0\""
    assert test_character.attributes["eye_color"] == "blue"

    # Test attribute update
    test_character.attributes["age"] = 26
    session.commit()
    assert test_character.attributes["age"] == 26

    # Test attribute deletion
    del test_character.attributes["weight"]
    session.commit()
    assert "weight" not in test_character.attributes
