from typing import Dict, Any, List
import random
import math
import logging
from backend.app.services.music_generator import generate_music_from_params

# Initialize logger
logger = logging.getLogger(__name__)

def generate_ai_music(harmony_params: Dict[str, Any], physics_params: Dict[str, Any],
                      ai_style: str = "default") -> Dict[str, Any]:
    """
    Generate music with AI assistance based on universe parameters and a chosen style.

    Args:
        harmony_params: Dictionary containing harmony parameters
        physics_params: Dictionary containing physics parameters
        ai_style: Style of music to generate (default, ambient, classical, electronic, etc.)

    Returns:
        Dictionary containing musical elements enhanced by AI processing
    """
    logger.info(f"Generating AI music with style: {ai_style}")

    # Get base music from standard generator
    base_music = generate_music_from_params(harmony_params, physics_params)

    # Apply AI style transformations
    if ai_style == "ambient":
        return apply_ambient_style(base_music)
    elif ai_style == "classical":
        return apply_classical_style(base_music)
    elif ai_style == "electronic":
        return apply_electronic_style(base_music)
    elif ai_style == "jazz":
        return apply_jazz_style(base_music)
    else:
        # Default - simple enhancements
        return apply_default_enhancements(base_music)

def apply_default_enhancements(music_data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply simple AI-like enhancements to make music more pleasing."""
    # Keep a copy of the original
    enhanced = music_data.copy()

    # Enhance the melody with better note distribution
    melody = enhanced["melody"]

    # Sort notes by position to find patterns
    note_values = [note["note"] for note in melody]

    # Smooth out large jumps between consecutive notes
    for i in range(1, len(melody)):
        # If the jump between consecutive notes is too large, add intermediate notes
        current_note = melody[i]["note"]
        prev_note = melody[i-1]["note"]

        if abs(current_note - prev_note) > 12:  # More than an octave
            # Move current note closer to previous
            melody[i]["note"] = prev_note + (0.3 * (current_note - prev_note))

    # Add more chord variations
    if len(enhanced["chord_progression"]) < 4:
        scale_type = enhanced["scale_type"]

        # Add more interesting chords based on scale
        if scale_type == "major":
            enhanced["chord_progression"].extend(["vi", "IV", "ii"])
        elif scale_type == "minor":
            enhanced["chord_progression"].extend(["III", "v", "VI"])
        else:
            enhanced["chord_progression"].extend(["V", "IV", "I"])

        # Trim to reasonable length
        enhanced["chord_progression"] = enhanced["chord_progression"][:6]

    # Add more metadata for frontend visualization
    enhanced["ai_metadata"] = {
        "style": "default",
        "complexity": 0.5,
        "mood": "neutral",
        "energy": 0.5
    }

    return enhanced

def apply_ambient_style(music_data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply ambient style transformations to the music."""
    ambient = music_data.copy()

    # Slower tempo for ambient
    ambient["tempo"] = int(ambient["tempo"] * 0.7)

    # Longer note durations
    for note in ambient["melody"]:
        note["duration"] = note["duration"] * 1.5

    # Simplify chord progression for ambient feel
    ambient["chord_progression"] = ["I", "vi", "IV", "I"]

    # Add ambient metadata
    ambient["ai_metadata"] = {
        "style": "ambient",
        "complexity": 0.3,
        "mood": "relaxed",
        "energy": 0.2,
        "reverb": 0.8,
        "delay": 0.6
    }

    return ambient

def apply_classical_style(music_data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply classical style transformations to the music."""
    classical = music_data.copy()

    # Moderate tempo for classical
    if classical["tempo"] > 140:
        classical["tempo"] = 140
    elif classical["tempo"] < 60:
        classical["tempo"] = 60

    # More varied note durations for classical feel
    durations = [0.25, 0.5, 0.75, 1.0, 1.5]

    # Create more classical patterns
    melody = classical["melody"]
    for i, note in enumerate(melody):
        # Pattern: shorter notes leading to longer ones
        if i % 4 == 0:
            note["duration"] = random.choice([0.25, 0.5])
        elif i % 4 == 3:
            note["duration"] = random.choice([1.0, 1.5])
        else:
            note["duration"] = random.choice(durations)

    # More complex chord progression
    classical["chord_progression"] = ["I", "IV", "V", "vi", "ii", "V7", "I"]

    # Add classical metadata
    classical["ai_metadata"] = {
        "style": "classical",
        "complexity": 0.7,
        "mood": "sophisticated",
        "energy": 0.5,
        "dynamics": {
            "crescendos": [{"start": 0.2, "end": 0.3}, {"start": 0.6, "end": 0.8}],
            "pattern": "classical"
        }
    }

    return classical

def apply_electronic_style(music_data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply electronic style transformations to the music."""
    electronic = music_data.copy()

    # Faster tempo for electronic
    electronic["tempo"] = int(electronic["tempo"] * 1.2)
    if electronic["tempo"] < 110:
        electronic["tempo"] = 110

    # More repetitive patterns
    melody = []
    original_melody = electronic["melody"]

    # Create a shorter core pattern
    pattern_length = min(8, len(original_melody))
    core_pattern = original_melody[:pattern_length]

    # Repeat the pattern with variations
    for _ in range(3):
        for note in core_pattern:
            new_note = note.copy()

            # Add slight variations to prevent it from being too repetitive
            if random.random() > 0.7:
                # Occasionally shift the note
                new_note["note"] += random.choice([-2, -1, 1, 2])

            melody.append(new_note)

    electronic["melody"] = melody

    # Simple chord progression repeated
    electronic["chord_progression"] = ["I", "V", "vi", "IV"] * 2

    # Add electronic metadata
    electronic["ai_metadata"] = {
        "style": "electronic",
        "complexity": 0.6,
        "mood": "energetic",
        "energy": 0.8,
        "effects": {
            "filter_cutoff": 0.7,
            "filter_resonance": 0.5,
            "bitcrush": 0.2
        }
    }

    return electronic

def apply_jazz_style(music_data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply jazz style transformations to the music."""
    jazz = music_data.copy()

    # Adjust tempo for jazz
    jazz["tempo"] = int(jazz["tempo"] * 0.9)

    # Add jazz scales and notes
    root_note = jazz["root_note"]

    # Jazz uses more complex chords and scales
    jazz_notes = [0, 2, 3, 5, 7, 9, 10]  # Dorian mode is common in jazz

    # Create more jazzy melody
    melody = []

    # Create a pattern with more jazz-like intervals
    for i in range(16):
        # Use more complex note selections
        scale_degree = random.choice(range(len(jazz_notes)))
        octave = random.choice([0, 1, 1, 2])

        note_value = root_note + jazz_notes[scale_degree] + (octave * 12)

        # Jazz uses more varied rhythms
        duration = random.choice([0.25, 0.5, 0.75, 1.0, 1.5])

        # Add some blue notes
        if random.random() > 0.8:
            note_value = note_value - 1  # Flat 5th or blue note

        melody.append({
            "note": note_value,
            "duration": duration
        })

    jazz["melody"] = melody

    # Jazz chord progression
    jazz["chord_progression"] = ["ii7", "V7", "Imaj7", "vi7", "ii7", "V7alt", "Imaj7"]

    # Add jazz metadata
    jazz["ai_metadata"] = {
        "style": "jazz",
        "complexity": 0.8,
        "mood": "sophisticated",
        "energy": 0.6,
        "swing": 0.7,
        "blue_notes": True
    }

    return jazz
