import os
import openai
from typing import Dict, List, Optional, Union

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
