"""AI service for parameter suggestions and optimization."""
import os
import openai
from typing import Dict, Any, List, Optional
from ..models import Universe

class AIService:
    def __init__(self):
        """Initialize AI service."""
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if self.api_key:
            openai.api_key = self.api_key

    def _validate_constraints(self, constraints: Dict[str, Any], target: str) -> List[str]:
        """Validate parameter constraints."""
        errors = []

        if target == 'physics':
            if 'min_gravity' in constraints and not (0 <= constraints['min_gravity'] <= 20):
                errors.append('min_gravity must be between 0 and 20')
            if 'max_gravity' in constraints and not (0 <= constraints['max_gravity'] <= 20):
                errors.append('max_gravity must be between 0 and 20')
            if 'min_friction' in constraints and not (0 <= constraints['min_friction'] <= 1):
                errors.append('min_friction must be between 0 and 1')
            if 'max_friction' in constraints and not (0 <= constraints['max_friction'] <= 1):
                errors.append('max_friction must be between 0 and 1')

        elif target == 'music':
            if 'min_tempo' in constraints and not (40 <= constraints['min_tempo'] <= 200):
                errors.append('min_tempo must be between 40 and 200')
            if 'max_tempo' in constraints and not (40 <= constraints['max_tempo'] <= 200):
                errors.append('max_tempo must be between 40 and 200')
            if 'min_harmony' in constraints and not (0 <= constraints['min_harmony'] <= 1):
                errors.append('min_harmony must be between 0 and 1')
            if 'max_harmony' in constraints and not (0 <= constraints['max_harmony'] <= 1):
                errors.append('max_harmony must be between 0 and 1')

        elif target == 'visualization':
            if 'min_brightness' in constraints and not (0 <= constraints['min_brightness'] <= 1):
                errors.append('min_brightness must be between 0 and 1')
            if 'max_brightness' in constraints and not (0 <= constraints['max_brightness'] <= 1):
                errors.append('max_brightness must be between 0 and 1')
            if 'min_saturation' in constraints and not (0 <= constraints['min_saturation'] <= 1):
                errors.append('min_saturation must be between 0 and 1')
            if 'max_saturation' in constraints and not (0 <= constraints['max_saturation'] <= 1):
                errors.append('max_saturation must be between 0 and 1')

        return errors

    def _generate_prompt(self, universe: Universe, target: str, constraints: Dict[str, Any]) -> str:
        """Generate prompt for AI parameter suggestions."""
        current_state = {
            'physics': universe.physics_parameters.to_dict(),
            'music': universe.music_parameters.to_dict(),
            'visualization': universe.visualization_parameters.to_dict()
        }

        prompt = f"""Given a universe with the following current parameters:
Physics: {current_state['physics']}
Music: {current_state['music']}
Visualization: {current_state['visualization']}

Please suggest optimized {target} parameters that will create a harmonious experience.
The suggestions should:
1. Maintain physical accuracy and realism
2. Create engaging and pleasant musical accompaniment
3. Provide visually appealing and responsive visualization

Constraints to consider:
{constraints}

Please provide specific parameter values and explain the reasoning behind each suggestion."""

        return prompt

    def _parse_ai_response(self, response: str, target: str) -> Dict[str, Any]:
        """Parse AI response into structured parameter suggestions."""
        try:
            # For now, using a simple mock response
            # In production, this would parse the actual AI response
            if target == 'physics':
                return {
                    'physics_parameters': {
                        'gravity': 9.81,
                        'friction': 0.5,
                        'elasticity': 0.7,
                        'airResistance': 0.1,
                        'density': 1.0
                    },
                    'explanation': 'Suggested parameters maintain realistic physics while allowing for interesting interactions.'
                }
            elif target == 'music':
                return {
                    'music_parameters': {
                        'harmony': 0.8,
                        'tempo': 120,
                        'key': 'C',
                        'scale': 'major'
                    },
                    'explanation': 'These parameters create an uplifting and engaging musical atmosphere.'
                }
            else:  # visualization
                return {
                    'visualization_parameters': {
                        'brightness': 0.7,
                        'saturation': 0.8,
                        'complexity': 0.6,
                        'colorScheme': 'rainbow'
                    },
                    'explanation': 'The suggested visualization parameters provide a vibrant and dynamic visual experience.'
                }
        except Exception as e:
            raise ValueError(f'Failed to parse AI response: {str(e)}')

    def get_parameter_suggestions(
        self,
        universe: Universe,
        target: str,
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get AI suggestions for parameter optimization."""
        if not self.api_key:
            raise ValueError('OpenAI API key not configured')

        if target not in ['physics', 'music', 'visualization']:
            raise ValueError('Invalid target parameter')

        constraints = constraints or {}
        validation_errors = self._validate_constraints(constraints, target)
        if validation_errors:
            raise ValueError(f'Invalid constraints: {", ".join(validation_errors)}')

        try:
            # Generate prompt
            prompt = self._generate_prompt(universe, target, constraints)

            # Get AI response
            # In production, this would make an actual API call
            # For now, we'll use mock responses
            # response = openai.Completion.create(
            #     engine="text-davinci-003",
            #     prompt=prompt,
            #     max_tokens=200,
            #     temperature=0.7
            # )
            # ai_response = response.choices[0].text.strip()

            # Parse response
            suggestions = self._parse_ai_response("mock_response", target)

            return suggestions

        except Exception as e:
            raise Exception(f'Failed to get AI suggestions: {str(e)}')
