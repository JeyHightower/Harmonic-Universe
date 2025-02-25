from typing import Dict, Any, List
import random
import math

def generate_music_from_params(harmony_params: Dict[str, Any], physics_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate music parameters based on universe's harmony and physics parameters.

    Args:
        harmony_params: Dictionary containing harmony parameters
        physics_params: Dictionary containing physics parameters

    Returns:
        Dictionary containing musical elements like notes, tempo, etc.
    """
    # Default scales
    scales = {
        "major": [0, 2, 4, 5, 7, 9, 11],
        "minor": [0, 2, 3, 5, 7, 8, 10],
        "pentatonic": [0, 2, 4, 7, 9],
        "blues": [0, 3, 5, 6, 7, 10],
        "chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    }

    # Default chord progressions
    chord_progressions = {
        "pop": ["I", "V", "vi", "IV"],
        "jazz": ["ii", "V", "I"],
        "blues": ["I", "IV", "I", "V", "IV", "I"]
    }

    # Extract parameters or use defaults
    root_note = harmony_params.get("root_note", {"value": 60})["value"]  # C4 in MIDI
    scale_type = harmony_params.get("scale_type", {"value": "major"})["value"]
    tempo = harmony_params.get("tempo", {"value": 120})["value"]

    # Use physics parameters to influence music
    gravity = physics_params.get("gravity", {"value": 9.81})["value"]
    temperature = physics_params.get("temperature", {"value": 293.15})["value"]

    # Map physics to musical properties
    # Higher gravity = slower tempo, lower pitch
    tempo_modifier = 1.0 - (gravity / 20.0)  # Normalize gravity
    tempo = int(tempo * (0.8 + (tempo_modifier * 0.4)))  # Adjust tempo based on gravity

    # Higher temperature = brighter sound (major scales), more energy (faster tempo)
    if temperature > 350:
        scale_type = "major"
        tempo += 20
    elif temperature < 250:
        scale_type = "minor"
        tempo -= 20

    # Generate melody using the scale
    scale = scales.get(scale_type, scales["major"])
    melody = []

    # Create a 16-note melody based on the scale
    for _ in range(16):
        # Choose a note from the scale
        scale_degree = random.choice(range(len(scale)))
        octave = random.choice([0, 1, 1, 2])  # Weight toward middle octaves
        note_value = root_note + scale[scale_degree] + (octave * 12)

        # Determine duration based on position in melody
        duration = random.choice([0.25, 0.5, 1.0])

        melody.append({
            "note": note_value,
            "duration": duration
        })

    # Generate chord progression
    if temperature > 300:
        progression_type = "pop"
    elif temperature < 280:
        progression_type = "blues"
    else:
        progression_type = "jazz"

    chord_progression = chord_progressions[progression_type]

    return {
        "root_note": root_note,
        "scale_type": scale_type,
        "tempo": tempo,
        "melody": melody,
        "chord_progression": chord_progression,
        "physics_influence": {
            "gravity": gravity,
            "temperature": temperature
        }
    }
