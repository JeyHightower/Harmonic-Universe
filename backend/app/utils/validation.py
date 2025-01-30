"""Validation utilities."""
import re
from typing import Optional, Dict, Any, Union
from functools import wraps
from flask import request, jsonify

def validate_request_json(required_fields):
    """
    Decorator to validate that required fields are present in request JSON.

    Args:
        required_fields (list): List of field names that must be present in request JSON

    Returns:
        Function: Decorated function that validates request JSON
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Request must be JSON"}), 400

            data = request.json
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400

            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    "error": f"Missing required fields: {', '.join(missing_fields)}"
                }), 400

            return f(*args, **kwargs)
        return decorated_function
    return decorator

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


def validate_storyboard_data(data: Dict[str, Any], update: bool = False) -> Optional[str]:
    """
    Validate storyboard data.

    Args:
        data: The data to validate
        update: Whether this is an update operation

    Returns:
        Error message if validation fails, None otherwise
    """
    if not update and 'title' not in data:
        return "Title is required"

    if 'title' in data:
        if not isinstance(data['title'], str):
            return "Title must be a string"
        if len(data['title'].strip()) < 1:
            return "Title cannot be empty"
        if len(data['title']) > 200:
            return "Title cannot be longer than 200 characters"

    if 'description' in data:
        if not isinstance(data['description'], str):
            return "Description must be a string"
        if len(data['description']) > 1000:
            return "Description cannot be longer than 1000 characters"

    if 'metadata' in data:
        if not isinstance(data['metadata'], dict):
            return "Metadata must be an object"

    return None


def validate_scene_data(data: Dict[str, Any], update: bool = False) -> Optional[str]:
    """
    Validate scene data.

    Args:
        data: The data to validate
        update: Whether this is an update operation

    Returns:
        Error message if validation fails, None otherwise
    """
    if not update:
        required_fields = ['title', 'sequence', 'content']
        for field in required_fields:
            if field not in data:
                return f"{field.capitalize()} is required"

    if 'title' in data:
        if not isinstance(data['title'], str):
            return "Title must be a string"
        if len(data['title'].strip()) < 1:
            return "Title cannot be empty"
        if len(data['title']) > 200:
            return "Title cannot be longer than 200 characters"

    if 'sequence' in data:
        if not isinstance(data['sequence'], int):
            return "Sequence must be an integer"
        if data['sequence'] < 0:
            return "Sequence cannot be negative"

    if 'content' in data:
        if not isinstance(data['content'], dict):
            return "Content must be an object"

    return None


def validate_visual_effect_data(data: Dict[str, Any], update: bool = False) -> Optional[str]:
    """
    Validate visual effect data.

    Args:
        data: The data to validate
        update: Whether this is an update operation

    Returns:
        Error message if validation fails, None otherwise
    """
    if not update:
        required_fields = ['name', 'effect_type', 'parameters']
        for field in required_fields:
            if field not in data:
                return f"{field.capitalize()} is required"

    if 'name' in data:
        if not isinstance(data['name'], str):
            return "Name must be a string"
        if len(data['name']) > 200:
            return "Name must be at most 200 characters"

    valid_effect_types = ['fade', 'blur', 'particle', 'shader', 'post_process', 'environment']
    if 'effect_type' in data:
        if not isinstance(data['effect_type'], str):
            return "Effect type must be a string"
        if data['effect_type'] not in valid_effect_types:
            return f"Effect type must be one of: {', '.join(valid_effect_types)}"

    if 'parameters' in data:
        if not isinstance(data['parameters'], dict):
            return "Parameters must be an object"

    return None


def validate_audio_track_data(data: Dict[str, Any], update: bool = False) -> Optional[str]:
    """
    Validate audio track data.

    Args:
        data: The data to validate
        update: Whether this is an update operation

    Returns:
        Error message if validation fails, None otherwise
    """
    if not update:
        required_fields = ['name', 'track_type', 'parameters']
        for field in required_fields:
            if field not in data:
                return f"{field.capitalize()} is required"

    if 'name' in data:
        if not isinstance(data['name'], str):
            return "Name must be a string"
        if len(data['name']) > 200:
            return "Name must be at most 200 characters"

    valid_track_types = ['music', 'sfx', 'ambient', 'voice']
    if 'track_type' in data:
        if not isinstance(data['track_type'], str):
            return "Track type must be a string"
        if data['track_type'] not in valid_track_types:
            return f"Track type must be one of: {', '.join(valid_track_types)}"

    if 'parameters' in data:
        if not isinstance(data['parameters'], dict):
            return "Parameters must be an object"
        if 'volume' in data['parameters']:
            volume = data['parameters']['volume']
            if not isinstance(volume, (int, float)):
                return "Volume must be a number"
            if not 0 <= volume <= 1:
                return "Volume must be between 0 and 1"

    return None
