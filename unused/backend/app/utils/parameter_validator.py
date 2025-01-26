"""
Parameter validation utilities for universe parameters.
"""
import re


def validate_physics_parameters(params):
    """Validate physics parameters."""
    errors = {}

    # Validate gravity (must be positive)
    if "gravity" in params:
        gravity = params["gravity"]
        if not isinstance(gravity, (int, float)) or gravity < 0:
            errors["gravity"] = "Gravity must be a positive number"

    # Validate friction (must be between 0 and 1)
    if "friction" in params:
        friction = params["friction"]
        if not isinstance(friction, (int, float)) or friction < 0 or friction > 1:
            errors["friction"] = "Friction must be between 0 and 1"

    # Validate elasticity (must be between 0 and 1)
    if "elasticity" in params:
        elasticity = params["elasticity"]
        if not isinstance(elasticity, (int, float)) or elasticity < 0 or elasticity > 1:
            errors["elasticity"] = "Elasticity must be between 0 and 1"

    return errors


def validate_music_parameters(params):
    """Validate music parameters."""
    errors = {}

    # Validate key (must be a valid musical key)
    valid_keys = [
        "C",
        "G",
        "D",
        "A",
        "E",
        "B",
        "F#",
        "C#",
        "F",
        "Bb",
        "Eb",
        "Ab",
        "Db",
        "Gb",
    ]
    if "key" in params:
        key = params["key"]
        if not isinstance(key, str) or key not in valid_keys:
            errors["key"] = f'Key must be one of: {", ".join(valid_keys)}'

    # Validate scale (must be a valid musical scale)
    valid_scales = ["major", "minor", "harmonic_minor", "melodic_minor", "pentatonic"]
    if "scale" in params:
        scale = params["scale"]
        if not isinstance(scale, str) or scale not in valid_scales:
            errors["scale"] = f'Scale must be one of: {", ".join(valid_scales)}'

    # Validate tempo (must be between 40 and 240 BPM)
    if "tempo" in params:
        tempo = params["tempo"]
        if not isinstance(tempo, (int, float)) or tempo < 40 or tempo > 240:
            errors["tempo"] = "Tempo must be between 40 and 240 BPM"

    return errors


def validate_visualization_parameters(params):
    """Validate visualization parameters."""
    errors = {}

    # Validate color parameters (must be valid hex colors)
    color_fields = ["background_color", "particle_color", "glow_color"]
    hex_color_pattern = re.compile(r"^#[0-9A-Fa-f]{6}$")

    for field in color_fields:
        if field in params:
            color = params[field]
            if not isinstance(color, str) or not hex_color_pattern.match(color):
                errors[field] = "Must be a valid hex color (e.g., #FF0000)"

    # Validate numeric parameters
    numeric_ranges = {
        "particle_count": (1, 10000, "Must be between 1 and 10000"),
        "particle_size": (0.1, 10.0, "Must be between 0.1 and 10.0"),
        "particle_speed": (0.1, 5.0, "Must be between 0.1 and 5.0"),
        "glow_intensity": (0.0, 1.0, "Must be between 0.0 and 1.0"),
        "blur_amount": (0.0, 1.0, "Must be between 0.0 and 1.0"),
        "trail_length": (0.0, 1.0, "Must be between 0.0 and 1.0"),
        "animation_speed": (0.1, 5.0, "Must be between 0.1 and 5.0"),
        "bounce_factor": (0.0, 1.0, "Must be between 0.0 and 1.0"),
        "rotation_speed": (0.0, 10.0, "Must be between 0.0 and 10.0"),
        "camera_zoom": (0.1, 5.0, "Must be between 0.1 and 5.0"),
        "camera_rotation": (0.0, 360.0, "Must be between 0.0 and 360.0"),
    }

    for field, (min_val, max_val, message) in numeric_ranges.items():
        if field in params:
            value = params[field]
            if (
                not isinstance(value, (int, float))
                or value < min_val
                or value > max_val
            ):
                errors[field] = message

    return errors


def validate_parameters(physics_params, music_params, vis_params):
    """
    Validate all parameters for a universe.
    Returns a dictionary of validation errors, or an empty dict if all parameters are valid.
    """
    errors = {}

    # Validate each parameter set
    physics_errors = validate_physics_parameters(physics_params)
    if physics_errors:
        errors["physics_parameters"] = physics_errors

    music_errors = validate_music_parameters(music_params)
    if music_errors:
        errors["music_parameters"] = music_errors

    vis_errors = validate_visualization_parameters(vis_params)
    if vis_errors:
        errors["visualization_parameters"] = vis_errors

    return errors
