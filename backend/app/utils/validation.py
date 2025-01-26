"""Validation utilities."""
import re


def validate_registration(data):
    """
    Validate user registration data.

    Args:
        data (dict): Registration data containing username, email, and password

    Returns:
        str: Error message if validation fails, None otherwise
    """
    if not data:
        return "No data provided"

    required_fields = ["username", "email", "password"]
    for field in required_fields:
        if field not in data:
            return f"{field.capitalize()} is required"

    # Username validation
    if len(data["username"]) < 3:
        return "Username must be at least 3 characters long"
    if len(data["username"]) > 30:
        return "Username must be less than 30 characters"
    if not re.match(r"^[a-zA-Z0-9_-]+$", data["username"]):
        return "Username can only contain letters, numbers, underscores, and hyphens"

    # Email validation
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, data["email"]):
        return "Invalid email format"

    # Password validation
    if len(data["password"]) < 8:
        return "Password must be at least 8 characters long"
    if len(data["password"]) > 128:
        return "Password must be less than 128 characters"
    if not any(c.isupper() for c in data["password"]):
        return "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in data["password"]):
        return "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in data["password"]):
        return "Password must contain at least one number"

    return None


def validate_login(data):
    """
    Validate user login data.

    Args:
        data (dict): Login data containing email and password

    Returns:
        str: Error message if validation fails, None otherwise
    """
    if not data:
        return "No data provided"

    required_fields = ["email", "password"]
    for field in required_fields:
        if field not in data:
            return f"{field.capitalize()} is required"

    # Email validation
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, data["email"]):
        return "Invalid email format"

    return None
