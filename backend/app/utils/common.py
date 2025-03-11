"""Common utility functions used across the application."""

import random
import string
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union


def random_string(length: int = 10) -> str:
    """Generate a random string of fixed length."""
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(length))


def random_email() -> str:
    """Generate a random email address."""
    return f"{random_string()}@example.com"


def format_datetime(dt: datetime) -> str:
    """Format datetime to ISO format with timezone."""
    return dt.isoformat() if dt else None


def parse_datetime(dt_str: str) -> Optional[datetime]:
    """Parse datetime from ISO format string."""
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def assert_dates_equal(
    date1: Union[str, datetime], date2: Union[str, datetime]
) -> bool:
    """Assert that two dates are equal, ignoring milliseconds."""
    if isinstance(date1, str):
        date1 = datetime.fromisoformat(date1.replace("Z", "+00:00"))
    if isinstance(date2, str):
        date2 = datetime.fromisoformat(date2.replace("Z", "+00:00"))
    return abs(date1 - date2) < timedelta(seconds=1)


def dict_exclude(d: Dict[str, Any], exclude_keys: List[str]) -> Dict[str, Any]:
    """Return a new dict with specified keys excluded."""
    return {k: v for k, v in d.items() if k not in exclude_keys}


def safe_divide(
    a: Union[int, float], b: Union[int, float], default: Union[int, float] = 0
) -> Union[int, float]:
    """Safely divide two numbers, returning default if denominator is 0."""
    try:
        return a / b if b != 0 else default
    except (TypeError, ValueError):
        return default


def truncate_string(s: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate a string to a maximum length, adding a suffix if truncated."""
    if len(s) <= max_length:
        return s
    return s[: max_length - len(suffix)] + suffix


def flatten_dict(
    d: Dict[str, Any], parent_key: str = "", sep: str = "_"
) -> Dict[str, Any]:
    """Flatten a nested dictionary, using separator between keys."""
    items: List[tuple] = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)
