import pytest
from app.models.location import Location
from sqlalchemy.exc import IntegrityError

def test_new_location(session, test_universe):
    """Test creating a new location"""
    location = Location(
        name="Test Location",
        description="A test location",
        universe_id=test_universe.id
    )
    session.add(location)
    session.commit()

    assert location.name == "Test Location"
    assert location.description == "A test location"
    assert location.universe_id == test_universe.id
    assert location.universe == test_universe
    assert location in test_universe.locations

def test_location_to_dict(session, test_location):
    """Test converting a location to dictionary"""
    location_dict = test_location.to_dict()

    assert location_dict["name"] == "Test Location"
    assert location_dict["description"] == "A test location"
    assert location_dict["universe_id"] == test_location.universe_id

def test_location_validation(session, test_universe):
    """Test location validation constraints"""
    # Test missing required fields
    with pytest.raises(IntegrityError):
        location = Location(description="Missing name")
        session.add(location)
        session.commit()
    session.rollback()

    # Test duplicate name in same universe
    location1 = Location(
        name="Same Name",
        description="First location",
        universe_id=test_universe.id
    )
    session.add(location1)
    session.commit()

    with pytest.raises(IntegrityError):
        location2 = Location(
            name="Same Name",
            description="Second location",
            universe_id=test_universe.id
        )
        session.add(location2)
        session.commit()
    session.rollback()

def test_location_relationships(session, test_universe, test_location):
    """Test location relationships"""
    # Test universe relationship
    assert test_location.universe == test_universe
    assert test_location in test_universe.locations

    # Test cascade delete
    session.delete(test_universe)
    session.commit()

    # Location should be deleted when universe is deleted
    assert session.query(Location).filter_by(id=test_location.id).first() is None

def test_location_attributes(session, test_location):
    """Test location attributes management"""
    # Add location attributes
    test_location.attributes = {
        "climate": "temperate",
        "population": 1000000,
        "terrain": "mountainous",
        "government": "democracy",
        "technology_level": "advanced"
    }
    session.commit()

    # Test attribute retrieval
    assert test_location.attributes["climate"] == "temperate"
    assert test_location.attributes["population"] == 1000000
    assert test_location.attributes["terrain"] == "mountainous"

    # Test attribute update
    test_location.attributes["population"] = 1100000
    session.commit()
    assert test_location.attributes["population"] == 1100000

    # Test attribute deletion
    del test_location.attributes["government"]
    session.commit()
    assert "government" not in test_location.attributes

def test_location_coordinates(session, test_location):
    """Test location coordinates management"""
    # Add coordinates
    test_location.coordinates = {
        "x": 123.45,
        "y": 67.89,
        "z": 0.0,
        "map_level": 1
    }
    session.commit()

    # Test coordinates retrieval
    assert test_location.coordinates["x"] == 123.45
    assert test_location.coordinates["y"] == 67.89
    assert test_location.coordinates["z"] == 0.0
    assert test_location.coordinates["map_level"] == 1

    # Test coordinates update
    test_location.coordinates["x"] = 124.45
    session.commit()
    assert test_location.coordinates["x"] == 124.45
