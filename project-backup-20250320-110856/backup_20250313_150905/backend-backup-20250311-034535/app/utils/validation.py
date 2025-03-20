"""Validation utility functions."""

import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime

# Email validation regex pattern
EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def is_valid_email(email: str) -> bool:
    """Validate email format."""
    if not email:
        return False
    return bool(EMAIL_PATTERN.match(email))


def is_valid_password(password: str, min_length: int = 8) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message).
    """
    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters long"

    checks = [
        (r"[A-Z]", "at least one uppercase letter"),
        (r"[a-z]", "at least one lowercase letter"),
        (r"[0-9]", "at least one number"),
        (r'[!@#$%^&*(),.?":{}|<>]', "at least one special character"),
    ]

    failed_checks = [msg for pattern, msg in checks if not re.search(pattern, password)]

    if failed_checks:
        return False, "Password must contain " + ", ".join(failed_checks)

    return True, ""


def is_valid_username(
    username: str, min_length: int = 3, max_length: int = 30
) -> tuple[bool, str]:
    """
    Validate username format.
    Returns (is_valid, error_message).
    """
    if len(username) < min_length:
        return False, f"Username must be at least {min_length} characters long"

    if len(username) > max_length:
        return False, f"Username must be at most {max_length} characters long"

    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        return (
            False,
            "Username can only contain letters, numbers, underscores, and hyphens",
        )

    return True, ""


def validate_date_range(start_date: datetime, end_date: datetime) -> tuple[bool, str]:
    """
    Validate a date range.
    Returns (is_valid, error_message).
    """
    if not start_date or not end_date:
        return False, "Both start and end dates are required"

    if start_date > end_date:
        return False, "Start date must be before end date"

    return True, ""


def validate_required_fields(
    data: Dict[str, Any], required_fields: List[str]
) -> tuple[bool, List[str]]:
    """
    Validate required fields in a dictionary.
    Returns (is_valid, missing_fields).
    """
    missing = [field for field in required_fields if not data.get(field)]
    return not bool(missing), missing


def validate_field_length(
    value: str, field_name: str, min_length: int = 0, max_length: Optional[int] = None
) -> tuple[bool, str]:
    """
    Validate the length of a string field.
    Returns (is_valid, error_message).
    """
    if len(value) < min_length:
        return False, f"{field_name} must be at least {min_length} characters long"

    if max_length and len(value) > max_length:
        return False, f"{field_name} must be at most {max_length} characters long"

    return True, ""


def validate_numeric_range(
    value: Union[int, float],
    field_name: str,
    min_value: Optional[Union[int, float]] = None,
    max_value: Optional[Union[int, float]] = None,
) -> tuple[bool, str]:
    """
    Validate a numeric value within a range.
    Returns (is_valid, error_message).
    """
    if min_value is not None and value < min_value:
        return False, f"{field_name} must be greater than or equal to {min_value}"

    if max_value is not None and value > max_value:
        return False, f"{field_name} must be less than or equal to {max_value}"

    return True, ""
