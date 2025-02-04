"""Test utilities."""

import random
import string
from typing import Dict

def random_lower_string(length: int = 32) -> str:
    """Generate a random lowercase string."""
    return "".join(random.choices(string.ascii_lowercase, k=length))

def random_email() -> str:
    """Generate a random email."""
    return f"{random_lower_string(10)}@{random_lower_string(6)}.com"

def random_password(length: int = 12) -> str:
    """Generate a random password."""
    characters = string.ascii_letters + string.digits + string.punctuation
    return "".join(random.choices(characters, k=length))

def get_user_authentication_headers(
    *, client, email: str, password: str
) -> Dict[str, str]:
    """Get user authentication headers."""
    data = {"username": email, "password": password}
    r = client.post("/api/v1/login/access-token", data=data)
    response = r.json()
    auth_token = response["access_token"]
    headers = {"Authorization": f"Bearer {auth_token}"}
    return headers
