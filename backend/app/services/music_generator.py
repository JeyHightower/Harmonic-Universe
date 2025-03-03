from typing import Dict, Any, List
import random
import math
import logging

logger = logging.getLogger(__name__)

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

    try:
        # Extract parameters or use defaults
        # Handle the nested structure of parameters
        root_note = 60  # C4 in MIDI
        if "key" in harmony_params:
            # Map key to MIDI note number (C4 = 60, C#4 = 61, etc.)
            key_map = {"C": 60, "C#": 61, "D": 62, "D#": 63, "E": 64, "F": 65,
                      "F#": 66, "G": 67, "G#": 68, "A": 69, "A#": 70, "B": 71,
                      "Db": 61, "Eb": 63, "Gb": 66, "Ab": 68, "Bb": 70}
            key = harmony_params["key"]["value"]
            root_note = key_map.get(key, 60)

        scale_type = "major"
        if "scale" in harmony_params:
            scale_type = harmony_params["scale"]["value"]
            # Map scale names if needed
            if scale_type == "harmonic_minor":
                scale_type = "minor"
            elif scale_type == "melodic_minor":
                scale_type = "minor"

        tempo = 120
        if "tempo" in harmony_params:
            tempo = harmony_params["tempo"]["value"]

        # Get melody complexity (if provided)
        melody_complexity = 0.5
        if "harmony_scale" in harmony_params:
            melody_complexity = harmony_params["harmony_scale"]["value"] / 2.0  # Normalize to 0-1 range

        # Use physics parameters to influence music
        gravity = 9.81
        if "gravity" in physics_params:
            gravity = physics_params["gravity"]["value"]

        temperature = 293.15
        if "temperature" in physics_params:
            temperature = physics_params["temperature"]["value"]

        # Map physics to musical properties
        # Higher gravity = slower tempo, lower pitch
        tempo_modifier = 1.0 - (gravity / 20.0)  # Normalize gravity

        # Only apply physics modifications if no custom tempo is provided
        if "tempo" not in harmony_params or harmony_params["tempo"].get("is_default", True):
            tempo = int(tempo * (0.8 + (tempo_modifier * 0.4)))  # Adjust tempo based on gravity

        # Higher temperature = brighter sound (major scales), more energy (faster tempo)
        # Only apply if scale type is not explicitly set
        if ("scale" not in harmony_params or harmony_params["scale"].get("is_default", True)):
            if temperature > 350:
                scale_type = "major"
                tempo += 20
            elif temperature < 250:
                scale_type = "minor"
                tempo -= 20

        # Generate melody using the scale
        scale = scales.get(scale_type, scales["major"])
        melody = []

        # Adjust note count based on complexity
        note_count = int(12 + (melody_complexity * 8))  # 12-20 notes based on complexity

        # Melody pattern complexity increases with complexity parameter
        # More complex melodies have more variation in note choice and duration
        for _ in range(note_count):
            # Choose a note from the scale - higher complexity uses more note positions
            if melody_complexity < 0.3:
                # Simple melodies use only a few notes and stay in middle register
                scale_degree = random.choice(range(min(4, len(scale))))
                octave = random.choice([0, 1])
            elif melody_complexity < 0.7:
                # Medium complexity uses more notes with some variation
                scale_degree = random.choice(range(len(scale)))
                octave = random.choice([0, 1, 1, 2])
            else:
                # Complex melodies use the full scale and more octave jumps
                scale_degree = random.choice(range(len(scale)))
                octave = random.choice([-1, 0, 1, 2, 2])

            note_value = root_note + scale[scale_degree] + (octave * 12)

            # Determine duration based on complexity
            if melody_complexity < 0.3:
                # Simple rhythms use mostly quarter and half notes
                duration = random.choice([0.5, 1.0, 1.0])
            elif melody_complexity < 0.7:
                # Medium complexity adds eighth notes
                duration = random.choice([0.25, 0.5, 0.5, 1.0])
            else:
                # Complex rhythms use more variation including triplets
                duration = random.choice([0.25, 0.25, 0.33, 0.5, 0.66, 1.0, 1.5])

            melody.append({
                "note": note_value,
                "duration": duration
            })

        # Generate chord progression
        if "scale" not in harmony_params or harmony_params["scale"].get("is_default", True):
            if temperature > 300:
                progression_type = "pop"
            elif temperature < 280:
                progression_type = "blues"
            else:
                progression_type = "jazz"
        else:
            # Choose progression based on scale type if custom
            if scale_type == "minor":
                progression_type = "jazz"
            elif scale_type == "blues" or scale_type == "pentatonic":
                progression_type = "blues"
            else:
                progression_type = "pop"

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
    except Exception as e:
        logger.error(f"Error in generate_music_from_params: {str(e)}")
        # Return a simple default music data structure
        return {
            "root_note": 60,
            "scale_type": "major",
            "tempo": 120,
            "melody": [{"note": 60, "duration": 1.0} for _ in range(8)],
            "chord_progression": ["I", "IV", "V", "I"],
            "physics_influence": {
                "gravity": 9.81,
                "temperature": 293.15
            }
        }
