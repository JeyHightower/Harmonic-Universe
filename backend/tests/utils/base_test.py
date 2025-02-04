"""Base test class for standardizing test setup and teardown."""

import pytest
from typing import Optional, Any, Dict, Type
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.models.core.user import User
from app.core.config.test_settings import TestSettings
from app.db.base import Base
from tests.utils.factories import (
    UserFactory,
    UniverseFactory,
    SceneFactory,
    AudioFileFactory,
    AIModelFactory,
    AIGenerationFactory,
    StoryboardFactory,
    TimelineFactory
)

class BaseTest:
    """Base test class with common functionality."""

    @pytest.fixture(autouse=True)
    def setup(self, db: Session, client: TestClient):
        """Set up test environment."""
        self.db = db
        self.client = client
        self._cleanup_data = []
        self.settings = TestSettings()
        self._setup_test_data()
        yield
        self._cleanup_test_data()

    def _setup_test_data(self):
        """Set up any test data needed for the test.
        Override in subclasses to add specific test data."""
        pass

    def _cleanup_test_data(self):
        """Clean up any test data after the test.
        Override in subclasses to clean up specific test data."""
        for obj in self._cleanup_data:
            self.db.delete(obj)
        self.db.commit()

    def create_test_user(self, **kwargs) -> Dict[str, Any]:
        """Create a test user."""
        user = UserFactory.create(db=self.db, **kwargs)
        self._cleanup_data.append(user)
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "obj": user
        }

    def create_test_universe(self, creator_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Create a test universe."""
        if not creator_id:
            user_dict = self.create_test_user()
            creator_id = user_dict["id"]

        universe = UniverseFactory.create(db=self.db, creator_id=creator_id, **kwargs)
        self._cleanup_data.append(universe)
        return {
            "id": universe.id,
            "name": universe.name,
            "description": universe.description,
            "obj": universe
        }

    def create_test_scene(self, universe_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Create a test scene."""
        if not universe_id:
            universe_dict = self.create_test_universe()
            universe_id = universe_dict["id"]

        scene = SceneFactory.create(db=self.db, universe_id=universe_id, **kwargs)
        self._cleanup_data.append(scene)
        return {
            "id": scene.id,
            "name": scene.name,
            "description": scene.description,
            "obj": scene
        }

    def assert_model_fields(self, model: Base, expected_data: Dict[str, Any]):
        """Assert model fields match expected data."""
        for field, value in expected_data.items():
            assert getattr(model, field) == value, f"Field {field} does not match"

    def assert_timestamps(self, model: Base):
        """Assert model has valid timestamps."""
        assert isinstance(model.created_at, datetime), "created_at is not a datetime"
        assert isinstance(model.updated_at, datetime), "updated_at is not a datetime"
        assert model.created_at <= model.updated_at, "created_at is after updated_at"

    def assert_relationships(self, model: Base, relationships: Dict[str, Any]):
        """Assert model relationships are correct."""
        for rel_name, expected in relationships.items():
            actual = getattr(model, rel_name)
            if isinstance(expected, list):
                assert len(actual) == len(expected), f"Relationship {rel_name} length mismatch"
                for item in expected:
                    assert item in actual, f"Item {item} not in relationship {rel_name}"
            else:
                assert actual == expected, f"Relationship {rel_name} does not match"

    def assert_api_response(self, response, expected_status_code: int, expected_data: Optional[Dict] = None):
        """Assert API response is correct."""
        assert response.status_code == expected_status_code, f"Expected status code {expected_status_code}, got {response.status_code}"
        if expected_data:
            response_data = response.json()
            for key, value in expected_data.items():
                assert response_data[key] == value, f"Response data key {key} does not match"

    def assert_error_response(self, response, expected_status_code: int, expected_detail: str):
        """Assert error response is correct."""
        assert response.status_code == expected_status_code
        response_data = response.json()
        assert "detail" in response_data
        assert response_data["detail"] == expected_detail

    def assert_model_validation(self, model_class: Type[Base], invalid_data: Dict[str, Any], expected_error: str):
        """Assert model validation works correctly."""
        with pytest.raises(ValueError) as exc_info:
            model_class(**invalid_data)
        assert str(exc_info.value) == expected_error

    def assert_db_state(self, model_class: Any, expected_count: int, **filters):
        """Assert database state for a model."""
        query = self.db.query(model_class)
        for field, value in filters.items():
            query = query.filter(getattr(model_class, field) == value)
        assert query.count() == expected_count, f"Expected {expected_count} records, found {query.count()}"

    def assert_relationship_count(self, model: Any, relationship: str, expected_count: int):
        """Assert that a relationship has the expected number of items."""
        actual_count = len(getattr(model, relationship))
        assert actual_count == expected_count, f"Expected {expected_count} {relationship}, found {actual_count}"
