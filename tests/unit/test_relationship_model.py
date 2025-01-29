import pytest
from app.models.relationship import Relationship
from app.models.character import Character
from sqlalchemy.exc import IntegrityError

def test_new_relationship(session, test_character):
    """Test creating a new relationship"""
    # Create another character for the relationship
    other_character = Character(
        name="Other Character",
        description="Another test character",
        universe_id=test_character.universe_id
    )
    session.add(other_character)
    session.commit()

    relationship = Relationship(
        name="Test Relationship",
        description="A test relationship",
        character_id=test_character.id,
        related_character_id=other_character.id,
        relationship_type="friend"
    )
    session.add(relationship)
    session.commit()

    assert relationship.name == "Test Relationship"
    assert relationship.description == "A test relationship"
    assert relationship.character_id == test_character.id
    assert relationship.related_character_id == other_character.id
    assert relationship.relationship_type == "friend"
    assert relationship.character == test_character
    assert relationship.related_character == other_character

def test_relationship_to_dict(session, test_character):
    """Test converting a relationship to dictionary"""
    # Create another character and relationship
    other_character = Character(
        name="Other Character",
        description="Another test character",
        universe_id=test_character.universe_id
    )
    session.add(other_character)
    session.commit()

    relationship = Relationship(
        name="Test Relationship",
        description="A test relationship",
        character_id=test_character.id,
        related_character_id=other_character.id,
        relationship_type="friend"
    )
    session.add(relationship)
    session.commit()

    relationship_dict = relationship.to_dict()

    assert relationship_dict["name"] == "Test Relationship"
    assert relationship_dict["description"] == "A test relationship"
    assert relationship_dict["character_id"] == test_character.id
    assert relationship_dict["related_character_id"] == other_character.id
    assert relationship_dict["relationship_type"] == "friend"

def test_relationship_validation(session, test_character):
    """Test relationship validation constraints"""
    # Create another character
    other_character = Character(
        name="Other Character",
        description="Another test character",
        universe_id=test_character.universe_id
    )
    session.add(other_character)
    session.commit()

    # Test missing required fields
    with pytest.raises(IntegrityError):
        relationship = Relationship(description="Missing name")
        session.add(relationship)
        session.commit()
    session.rollback()

    # Test duplicate relationship between same characters
    relationship1 = Relationship(
        name="Same Relationship",
        description="First relationship",
        character_id=test_character.id,
        related_character_id=other_character.id,
        relationship_type="friend"
    )
    session.add(relationship1)
    session.commit()

    with pytest.raises(IntegrityError):
        relationship2 = Relationship(
            name="Same Relationship",
            description="Second relationship",
            character_id=test_character.id,
            related_character_id=other_character.id,
            relationship_type="friend"
        )
        session.add(relationship2)
        session.commit()
    session.rollback()

def test_relationship_cascade(session, test_character):
    """Test relationship cascade behavior"""
    # Create another character and relationship
    other_character = Character(
        name="Other Character",
        description="Another test character",
        universe_id=test_character.universe_id
    )
    session.add(other_character)
    session.commit()

    relationship = Relationship(
        name="Test Relationship",
        description="A test relationship",
        character_id=test_character.id,
        related_character_id=other_character.id,
        relationship_type="friend"
    )
    session.add(relationship)
    session.commit()

    # Test cascade delete when character is deleted
    session.delete(test_character)
    session.commit()

    # Relationship should be deleted when character is deleted
    assert session.query(Relationship).filter_by(id=relationship.id).first() is None

def test_relationship_attributes(session, test_character):
    """Test relationship attributes management"""
    # Create another character and relationship
    other_character = Character(
        name="Other Character",
        description="Another test character",
        universe_id=test_character.universe_id
    )
    session.add(other_character)
    session.commit()

    relationship = Relationship(
        name="Test Relationship",
        description="A test relationship",
        character_id=test_character.id,
        related_character_id=other_character.id,
        relationship_type="friend"
    )
    session.add(relationship)
    session.commit()

    # Add relationship attributes
    relationship.attributes = {
        "strength": "strong",
        "duration": "5 years",
        "trust_level": "high",
        "mutual": True
    }
    session.commit()

    # Test attribute retrieval
    assert relationship.attributes["strength"] == "strong"
    assert relationship.attributes["duration"] == "5 years"
    assert relationship.attributes["trust_level"] == "high"

    # Test attribute update
    relationship.attributes["trust_level"] = "very high"
    session.commit()
    assert relationship.attributes["trust_level"] == "very high"

    # Test attribute deletion
    del relationship.attributes["mutual"]
    session.commit()
