"""Parameter validation utilities."""

def validate_physics_parameters(params):
    """Validate physics parameters."""
    errors = {}

    if 'gravity' in params:
        gravity = params['gravity']
        if not isinstance(gravity, (int, float)) or gravity < 0 or gravity > 20:
            errors['gravity'] = 'Gravity must be between 0 and 20'

    if 'friction' in params:
        friction = params['friction']
        if not isinstance(friction, (int, float)) or friction < 0 or friction > 1:
            errors['friction'] = 'Friction must be between 0 and 1'

    if 'elasticity' in params:
        elasticity = params['elasticity']
        if not isinstance(elasticity, (int, float)) or elasticity < 0 or elasticity > 1:
            errors['elasticity'] = 'Elasticity must be between 0 and 1'

    if 'airResistance' in params:
        air_resistance = params['airResistance']
        if not isinstance(air_resistance, (int, float)) or air_resistance < 0 or air_resistance > 1:
            errors['airResistance'] = 'Air resistance must be between 0 and 1'

    if 'density' in params:
        density = params['density']
        if not isinstance(density, (int, float)) or density < 0 or density > 5:
            errors['density'] = 'Density must be between 0 and 5'

    return errors

def validate_music_parameters(params):
    """Validate music parameters."""
    errors = {}

    if 'harmony' in params:
        harmony = params['harmony']
        if not isinstance(harmony, (int, float)) or harmony < 0 or harmony > 1:
            errors['harmony'] = 'Harmony must be between 0 and 1'

    if 'tempo' in params:
        tempo = params['tempo']
        if not isinstance(tempo, (int, float)) or tempo < 40 or tempo > 200:
            errors['tempo'] = 'Tempo must be between 40 and 200 BPM'

    if 'key' in params:
        key = params['key']
        valid_keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        if not isinstance(key, str) or key not in valid_keys:
            errors['key'] = f'Key must be one of: {", ".join(valid_keys)}'

    if 'scale' in params:
        scale = params['scale']
        valid_scales = ['major', 'minor', 'harmonic minor', 'melodic minor', 'pentatonic', 'blues']
        if not isinstance(scale, str) or scale not in valid_scales:
            errors['scale'] = f'Scale must be one of: {", ".join(valid_scales)}'

    return errors

def validate_visualization_parameters(params):
    """Validate visualization parameters."""
    errors = {}

    if 'brightness' in params:
        brightness = params['brightness']
        if not isinstance(brightness, (int, float)) or brightness < 0 or brightness > 1:
            errors['brightness'] = 'Brightness must be between 0 and 1'

    if 'saturation' in params:
        saturation = params['saturation']
        if not isinstance(saturation, (int, float)) or saturation < 0 or saturation > 1:
            errors['saturation'] = 'Saturation must be between 0 and 1'

    if 'complexity' in params:
        complexity = params['complexity']
        if not isinstance(complexity, (int, float)) or complexity < 0 or complexity > 1:
            errors['complexity'] = 'Complexity must be between 0 and 1'

    if 'colorScheme' in params:
        color_scheme = params['colorScheme']
        valid_schemes = ['rainbow', 'monochrome', 'complementary', 'analogous', 'triadic', 'custom']
        if not isinstance(color_scheme, str) or color_scheme not in valid_schemes:
            errors['colorScheme'] = f'Color scheme must be one of: {", ".join(valid_schemes)}'

    return errors

def validate_parameters(physics_params, music_params, vis_params):
    """Validate all parameters."""
    errors = {}

    physics_errors = validate_physics_parameters(physics_params)
    if physics_errors:
        errors['physics_parameters'] = physics_errors

    music_errors = validate_music_parameters(music_params)
    if music_errors:
        errors['music_parameters'] = music_errors

    vis_errors = validate_visualization_parameters(vis_params)
    if vis_errors:
        errors['visualization_parameters'] = vis_errors

    return errors
