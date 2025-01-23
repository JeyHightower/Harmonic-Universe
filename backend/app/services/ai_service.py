import os
import openai
from typing import Dict, List, Optional, Union
import re
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key not found in environment variables")
        openai.api_key = self.api_key

    def get_parameter_suggestions(self, universe_id: int) -> Dict[str, Union[float, str]]:
        from ..models import Universe  # Import moved here
        universe = Universe.query.get(universe_id)
        if not universe:
            raise ValueError(f"Universe with id {universe_id} not found")

        # Rest of the function implementation...
        return {
            "physics": {
                "gravity": 9.81,
                "friction": 0.5,
                "elasticity": 0.7,
                "air_resistance": 0.1,
                "density": 1.0
            },
            "music": {
                "harmony": 0.6,
                "tempo": 120,
                "key": "C",
                "scale": "major",
                "rhythm_complexity": 0.5,
                "melody_range": 0.7
            },
            "visualization": {
                "brightness": 0.8,
                "saturation": 0.7,
                "complexity": 0.5,
                "color_scheme": "complementary"
            }
        }

    def generate_music(self, universe_id: int, parameters: Dict) -> Dict:
        """Generate music based on universe parameters using AI."""
        try:
            # Prepare prompt for music generation
            prompt = self._create_music_prompt(parameters)

            # Call OpenAI API for music generation guidance
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{
                    "role": "system",
                    "content": "You are a music composition expert that provides musical parameters and patterns."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.7
            )

            # Extract musical parameters from AI response
            suggestions = self._parse_music_response(response.choices[0].message.content)

            return {
                "success": True,
                "parameters": suggestions,
                "message": "Music parameters generated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to generate music parameters"
            }

    def _create_music_prompt(self, parameters: Dict) -> str:
        """Create a prompt for music generation based on parameters."""
        return f"""
        Create musical parameters for a universe with the following characteristics:
        - Physics: Gravity {parameters.get('gravity', 9.81)}, Friction {parameters.get('friction', 0.5)}
        - Mood: {parameters.get('mood', 'neutral')}
        - Complexity: {parameters.get('complexity', 0.5)}

        Please provide specific values for:
        1. Tempo (BPM)
        2. Musical key
        3. Scale type
        4. Harmony complexity (0-1)
        5. Rhythm patterns
        6. Melodic progression
        """

    def _parse_music_response(self, response: str) -> Dict:
        """Parse the AI response into structured music parameters."""
        # Default values
        params = {
            "tempo": 120,
            "key": "C",
            "scale": "major",
            "harmony_complexity": 0.5,
            "rhythm_pattern": "4/4",
            "melodic_progression": ["I", "IV", "V", "I"]
        }

        try:
            # Extract parameters from AI response
            # This is a simplified version - you would need more robust parsing
            if "tempo" in response.lower():
                # Extract tempo value
                tempo_match = re.search(r'tempo.*?(\d+)', response.lower())
                if tempo_match:
                    params["tempo"] = int(tempo_match.group(1))

            # Extract key if mentioned
            key_match = re.search(r'key.*?([A-G][#b]?)', response)
            if key_match:
                params["key"] = key_match.group(1)

            # Extract scale if mentioned
            scales = ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian"]
            for scale in scales:
                if scale in response.lower():
                    params["scale"] = scale
                    break

            # Extract harmony complexity if mentioned
            harmony_match = re.search(r'harmony.*?(0\.\d+|1\.0|1)', response.lower())
            if harmony_match:
                params["harmony_complexity"] = float(harmony_match.group(1))

        except Exception as e:
            logger.error(f"Error parsing music response: {e}")

        return params

    def apply_style_transfer(self, source_id: int, target_id: int, aspects: List[str]) -> Dict:
        """Apply musical style transfer between universes."""
        try:
            # Get source and target universe parameters
            source = Universe.query.get(source_id)
            target = Universe.query.get(target_id)

            if not (source and target):
                raise ValueError("Source or target universe not found")

            # Extract relevant parameters based on aspects
            transfer_params = {}
            for aspect in aspects:
                if aspect == "music":
                    transfer_params["music"] = source.music_parameters.to_dict()
                elif aspect == "physics":
                    transfer_params["physics"] = source.physics_parameters.to_dict()

            # Generate new parameters using style transfer
            new_params = self._generate_style_transfer(transfer_params, target.to_dict())

            return {
                "success": True,
                "parameters": new_params,
                "message": "Style transfer completed successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to apply style transfer"
            }

    def _generate_style_transfer(self, source_params: Dict, target_params: Dict) -> Dict:
        """Generate new parameters based on style transfer."""
        try:
            # Create prompt for style transfer
            prompt = f"""
            Apply the musical style from source universe to target universe.
            Source parameters: {source_params}
            Target parameters: {target_params}

            Generate new parameters that maintain the essential characteristics
            of the target while adopting the style of the source.
            """

            # Get AI suggestions for style transfer
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{
                    "role": "system",
                    "content": "You are an expert in musical style transfer and parameter adaptation."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.7
            )

            # Parse and return new parameters
            return self._parse_music_response(response.choices[0].message.content)

        except Exception as e:
            logger.error(f"Error in style transfer: {e}")
            raise
