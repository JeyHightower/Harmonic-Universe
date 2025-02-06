"""Test data validation fixtures."""

import pytest
from typing import Dict, Any, Callable, List
from pydantic import BaseModel, ValidationError
import re

@pytest.fixture
def validate_email() -> Callable[[str], bool]:
    """Get a function that validates email addresses."""
    def _validate(email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    return _validate

@pytest.fixture
def validate_password() -> Callable[[str], Dict[str, Any]]:
    """Get a function that validates password strength."""
    def _validate(password: str) -> Dict[str, Any]:
        has_length = len(password) >= 8
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(not c.isalnum() for c in password)

        return {
            "is_valid": all([has_length, has_upper, has_lower, has_digit]),
            "checks": {
                "length": has_length,
                "uppercase": has_upper,
                "lowercase": has_lower,
                "digit": has_digit,
                "special": has_special
            }
        }
    return _validate

@pytest.fixture
def validate_uuid() -> Callable[[str], bool]:
    """Get a function that validates UUID strings."""
    def _validate(uuid_str: str) -> bool:
        pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        return bool(re.match(pattern, uuid_str.lower()))
    return _validate

@pytest.fixture
def validate_metadata() -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    """Get a function that validates metadata structure."""
    def _validate(metadata: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ["genre", "theme", "tags"]
        has_required = all(field in metadata for field in required_fields)
        valid_tags = isinstance(metadata.get("tags", []), list)

        return {
            "is_valid": has_required and valid_tags,
            "checks": {
                "has_required_fields": has_required,
                "valid_tags": valid_tags
            },
            "missing_fields": [
                field for field in required_fields
                if field not in metadata
            ]
        }
    return _validate

@pytest.fixture
def validate_test_data() -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    """Get a function that validates complete test datasets."""
    def _validate(data: Dict[str, Any]) -> Dict[str, Any]:
        required_sections = ["users", "universes", "scenes", "metadata"]
        has_sections = all(section in data for section in required_sections)

        validation = {
            "is_valid": has_sections,
            "sections": {},
            "relationships": {
                "valid_creator_ids": True,
                "valid_universe_ids": True
            }
        }

        if has_sections:
            # Validate each section
            for section in required_sections:
                if section == "metadata":
                    validation["sections"][section] = isinstance(data[section], dict)
                else:
                    validation["sections"][section] = isinstance(data[section], list)

            # Validate relationships
            creator_ids = {user["id"] for user in data["users"]}
            universe_ids = {universe["id"] for universe in data["universes"]}

            # Check creator IDs
            for universe in data["universes"]:
                if universe["creator_id"] not in creator_ids:
                    validation["relationships"]["valid_creator_ids"] = False
                    break

            # Check universe IDs
            for scene in data["scenes"]:
                if scene["universe_id"] not in universe_ids:
                    validation["relationships"]["valid_universe_ids"] = False
                    break

        return validation
    return _validate
