import random
import string
import uuid
from typing import Dict, Optional

def random_lower_string() -> str:
    """Generate a random lowercase string."""
    return "".join(random.choices(string.ascii_lowercase, k=32))

def random_email() -> str:
    """Generate a random email address."""
    return f"{random_lower_string()}@{random_lower_string()}.com"

def random_uuid() -> uuid.UUID:
    """Generate a random UUID."""
    return uuid.uuid4()

def random_dict() -> Dict:
    """Generate a random dictionary with test data."""
    return {
        "key1": random_lower_string(),
        "key2": random_lower_string(),
        "key3": random_lower_string()
    }

def random_float(min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Generate a random float between min_val and max_val."""
    return random.uniform(min_val, max_val)

def random_int(min_val: int = 0, max_val: int = 100) -> int:
    """Generate a random integer between min_val and max_val."""
    return random.randint(min_val, max_val)
