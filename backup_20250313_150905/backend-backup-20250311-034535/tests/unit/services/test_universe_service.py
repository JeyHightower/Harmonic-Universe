import pytest
from app.services.universe_service import UniverseService
from app.models import Universe, User
from app.exceptions import UniverseNotFoundError, UnauthorizedError


def test_create_universe(app, test_user):
    """Test universe creation through service layer"""
    with app.app_context():
        service = UniverseService()
        universe = service.create_universe(
            name="Test Universe",
            description="Test Description",
            creator_id=test_user.id,
        )

        assert universe.name == "Test Universe"
        assert universe.description == "Test Description"
        assert universe.creator_id == test_user.id


def test_get_universe(app, test_user):
    """Test retrieving a universe through service layer"""
    with app.app_context():
        service = UniverseService()

        # Create test universe
        universe = service.create_universe(
            name="Test Universe",
            description="Test Description",
            creator_id=test_user.id,
        )

        # Retrieve it
        retrieved = service.get_universe(universe.id)
        assert retrieved.id == universe.id
        assert retrieved.name == universe.name


def test_get_nonexistent_universe(app):
    """Test attempting to retrieve a nonexistent universe"""
    with app.app_context():
        service = UniverseService()
        with pytest.raises(UniverseNotFoundError):
            service.get_universe(999)


def test_update_universe(app, test_user):
    """Test updating a universe through service layer"""
    with app.app_context():
        service = UniverseService()
        universe = service.create_universe(
            name="Test Universe",
            description="Test Description",
            creator_id=test_user.id,
        )

        updated = service.update_universe(
            universe_id=universe.id,
            user_id=test_user.id,
            name="Updated Universe",
            description="Updated Description",
        )

        assert updated.name == "Updated Universe"
        assert updated.description == "Updated Description"


def test_unauthorized_update(app, test_user):
    """Test attempting to update someone else's universe"""
    with app.app_context():
        service = UniverseService()
        universe = service.create_universe(
            name="Test Universe",
            description="Test Description",
            creator_id=test_user.id,
        )

        with pytest.raises(UnauthorizedError):
            service.update_universe(
                universe_id=universe.id,
                user_id=999,  # Different user
                name="Updated Universe",
                description="Updated Description",
            )
