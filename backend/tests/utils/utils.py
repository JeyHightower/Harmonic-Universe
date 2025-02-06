"""Test utility functions."""

import random
import string
import uuid

def random_lower_string() -> str:
    """Generate a random lowercase string."""
    return "".join(random.choices(string.ascii_lowercase, k=32))

def random_email() -> str:
    """Generate a random email address."""
    return f"{random_lower_string()}@example.com"

def random_uuid() -> str:
    """Generate a random UUID string."""
    return str(uuid.uuid4())
