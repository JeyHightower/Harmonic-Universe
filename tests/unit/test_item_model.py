import pytest
from app.models.item import Item
from sqlalchemy.exc import IntegrityError

def test_new_item(session, test_universe):
    """Test creating a new item"""
    item = Item(
        name="Test Item",
        description="A test item",
        universe_id=test_universe.id
    )
    session.add(item)
    session.commit()

    assert item.name == "Test Item"
    assert item.description == "A test item"
    assert item.universe_id == test_universe.id
    assert item.universe == test_universe
    assert item in test_universe.items

def test_item_to_dict(session, test_item):
    """Test converting an item to dictionary"""
    item_dict = test_item.to_dict()

    assert item_dict["name"] == "Test Item"
    assert item_dict["description"] == "A test item"
    assert item_dict["universe_id"] == test_item.universe_id

def test_item_validation(session, test_universe):
    """Test item validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        item = Item(description="Missing name")
        session.add(item)
        session.commit()
    session.rollback()

    # Test duplicate name in same universe
    item1 = Item(
        name="Same Name",
        description="First item",
        universe_id=test_universe.id
    )
    session.add(item1)
    session.commit()

    with pytest.raises(IntegrityError):
        item2 = Item(
            name="Same Name",
            description="Second item",
            universe_id=test_universe.id
        )
        session.add(item2)
        session.commit()
    session.rollback()

def test_item_relationships(session, test_universe, test_item):
    """Test item relationships"""
    # Test universe relationship
    assert test_item.universe == test_universe
    assert test_item in test_universe.items

    # Test cascade delete
    session.delete(test_universe)
    session.commit()

    # Item should be deleted when universe is deleted
    assert session.query(Item).filter_by(id=test_item.id).first() is None

def test_item_attributes(session, test_item):
    """Test item attributes management"""
    # Add item attributes
    test_item.attributes = {
        "weight": 2.5,
        "value": 100,
        "rarity": "uncommon",
        "material": "steel",
        "magical": True
    }
    session.commit()

    # Test attribute retrieval
    assert test_item.attributes["weight"] == 2.5
    assert test_item.attributes["value"] == 100
    assert test_item.attributes["rarity"] == "uncommon"

    # Test attribute update
    test_item.attributes["value"] = 150
    session.commit()
    assert test_item.attributes["value"] == 150

    # Test attribute deletion
    del test_item.attributes["material"]
    session.commit()
    assert "material" not in test_item.attributes

def test_item_ownership(session, test_item, test_character):
    """Test item ownership management"""
    # Set item owner
    test_item.owner_id = test_character.id
    session.commit()

    # Test owner relationship
    assert test_item.owner == test_character
    assert test_item in test_character.owned_items

    # Change owner
    new_character = Character(
        name="New Owner",
        description="A new character",
        universe_id=test_item.universe_id
    )
    session.add(new_character)
    session.commit()

    test_item.owner_id = new_character.id
    session.commit()

    assert test_item.owner == new_character
    assert test_item in new_character.owned_items
    assert test_item not in test_character.owned_items
