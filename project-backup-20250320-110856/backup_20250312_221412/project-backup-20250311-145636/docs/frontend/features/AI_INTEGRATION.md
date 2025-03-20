# AI Integration Guide

## Overview

This document explains how AI is integrated into Harmonic Universe to provide intelligent parameter suggestions and enhance the creative experience.

## AI Features

### 1. Parameter Suggestions

The AI system can suggest optimal parameters for physics, music, and visualization based on:

- Current parameter values
- User preferences
- Historical data
- Creative goals

### 2. Style Transfer

AI assists in transferring styles between universes by:

- Analyzing parameter patterns
- Identifying key characteristics
- Generating new parameter combinations
- Preserving core elements while adapting style

### 3. Creative Exploration

AI helps users explore new creative possibilities by:

- Generating variations of existing universes
- Suggesting complementary parameter sets
- Identifying interesting parameter combinations
- Providing creative prompts

## Implementation

### 1. AI Service

```python
class AIService:
    def __init__(self, model_config):
        self.model = load_model(model_config)
        self.parameter_constraints = load_constraints()
        self.history = ParameterHistory()

    async def get_parameter_suggestions(
        self,
        current_parameters,
        user_preferences,
        creative_goals
    ):
        """
        Generate parameter suggestions based on current state and user input.
        """
        # Prepare input context
        context = self._prepare_context(
            current_parameters,
            user_preferences,
            creative_goals
        )

        # Generate suggestions
        suggestions = await self.model.generate(
            context,
            temperature=0.7,
            num_suggestions=3
        )

        # Validate and refine suggestions
        valid_suggestions = self._validate_suggestions(suggestions)

        # Update suggestion history
        self.history.add_suggestions(valid_suggestions)

        return valid_suggestions

    def _prepare_context(
        self,
        current_parameters,
        user_preferences,
        creative_goals
    ):
        """
        Prepare context for AI model input.
        """
        return f"""
        Current Parameters:
        {json.dumps(current_parameters, indent=2)}

        User Preferences:
        {json.dumps(user_preferences, indent=2)}

        Creative Goals:
        {', '.join(creative_goals)}

        Previous Successful Combinations:
        {self.history.get_relevant_examples()}
        """

    def _validate_suggestions(
        self,
        suggestions
    ):
        """
        Validate and refine AI suggestions.
        """
        valid_suggestions = {}

        for category, params in suggestions.items():
            valid_params = {}
            for param, value in params.items():
                if self._is_valid_parameter(category, param, value):
                    valid_params[param] = value
                else:
                    valid_params[param] = self._adjust_parameter(
                        category, param, value
                    )
            valid_suggestions[category] = valid_params

        return valid_suggestions

    def _is_valid_parameter(
        self,
        category,
        param,
        value
    ):
        """
        Check if parameter value is valid.
        """
        constraints = self.parameter_constraints[category][param]

        if isinstance(value, (int, float)):
            return (
                value >= constraints['min'] and
                value <= constraints['max']
            )
        elif isinstance(value, str):
            return value in constraints['allowed_values']

        return False

    def _adjust_parameter(
        self,
        category,
        param,
        value
    ):
        """
        Adjust invalid parameter to nearest valid value.
        """
        constraints = self.parameter_constraints[category][param]

        if isinstance(value, (int, float)):
            return max(
                constraints['min'],
                min(constraints['max'], value)
            )
        elif isinstance(value, str):
            return constraints['default']

        return constraints['default']
```

### 2. Parameter History

```python
class ParameterHistory:
    def __init__(self, max_history=1000):
        self.history = []
        self.max_history = max_history

    def add_suggestions(
        self,
        suggestions,
        metadata=None
    ):
        """
        Add suggestions to history with metadata.
        """
        entry = {
            'suggestions': suggestions,
            'timestamp': datetime.utcnow(),
            'metadata': metadata or {}
        }

        self.history.append(entry)

        if len(self.history) > self.max_history:
            self.history.pop(0)

    def get_relevant_examples(
        self,
        current_parameters=None,
        limit=5
    ):
        """
        Get relevant historical examples.
        """
        if not current_parameters:
            return self.history[-limit:]

        # Calculate relevance scores
        scored_examples = [
            (self._calculate_relevance(entry, current_parameters), entry)
            for entry in self.history
        ]

        # Sort by relevance
        scored_examples.sort(reverse=True)

        return [example for _, example in scored_examples[:limit]]

    def _calculate_relevance(
        self,
        entry,
        current_parameters
    ):
        """
        Calculate relevance score for historical entry.
        """
        score = 0.0
        suggestions = entry['suggestions']

        for category, params in current_parameters.items():
            if category in suggestions:
                for param, value in params.items():
                    if param in suggestions[category]:
                        # Calculate parameter similarity
                        similarity = self._parameter_similarity(
                            value,
                            suggestions[category][param]
                        )
                        score += similarity

        # Apply time decay
        age = datetime.utcnow() - entry['timestamp']
        time_factor = math.exp(-age.total_seconds() / (7 * 24 * 3600))  # 1-week half-life

        return score * time_factor

    def _parameter_similarity(
        self,
        value1,
        value2
    ):
        """
        Calculate similarity between parameter values.
        """
        if isinstance(value1, (int, float)) and isinstance(value2, (int, float)):
            # Numerical similarity
            return 1.0 - min(1.0, abs(value1 - value2) / max(abs(value1), abs(value2)))
        elif isinstance(value1, str) and isinstance(value2, str):
            # String similarity
            return 1.0 if value1 == value2 else 0.0

        return 0.0
```

### 3. API Integration

```python
@app.route('/api/ai/suggestions', methods=['POST'])
@jwt_required
def get_ai_suggestions():
    """
    Get AI-generated parameter suggestions.
    """
    data = request.get_json()

    try:
        suggestions = ai_service.get_parameter_suggestions(
            current_parameters=data.get('current_parameters', {}),
            user_preferences=data.get('user_preferences', {}),
            creative_goals=data.get('creative_goals', [])
        )

        return jsonify({
            'success': True,
            'suggestions': suggestions
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/style-transfer', methods=['POST'])
@jwt_required
def transfer_style():
    """
    Transfer style between universes.
    """
    data = request.get_json()

    try:
        transferred_parameters = ai_service.transfer_style(
            source_universe_id=data['source_universe_id'],
            target_universe_id=data['target_universe_id'],
            style_strength=data.get('style_strength', 0.5)
        )

        return jsonify({
            'success': True,
            'parameters': transferred_parameters
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

## Frontend Integration

### 1. AI Suggestion Component

```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function AISuggestion({ parameters, onApply }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setLoading(true);
        const response = await fetch('/api/ai/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parameters }),
        });
        const data = await response.json();
        setSuggestions(data.suggestions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [parameters]);

  return (
    <div className="ai-suggestions">
      {loading && <div className="loading">Loading suggestions...</div>}
      {error && <div className="error-message">{error}</div>}
      {suggestions.map((suggestion, index) => (
        <div key={index} className="suggestion">
          <h3>{suggestion.title}</h3>
          <p>{suggestion.description}</p>
          <button onClick={() => onApply(suggestion.parameters)}>Apply</button>
        </div>
      ))}
    </div>
  );
}

AISuggestion.propTypes = {
  parameters: PropTypes.object.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default AISuggestion;
```

### 2. Style Transfer Component

```jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

function StyleTransfer({ sourceId, targetId, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const startTransfer = async () => {
    try {
      setStatus('processing');
      const response = await fetch('/api/ai/style-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId,
          targetId,
        }),
      });
      const result = await response.json();
      onComplete(result);
      setStatus('complete');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="style-transfer">
      <h2>Style Transfer</h2>
      {status === 'processing' && (
        <div className="progress">
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      <button onClick={startTransfer} disabled={status === 'processing'}>
        Start Transfer
      </button>
    </div>
  );
}

StyleTransfer.propTypes = {
  sourceId: PropTypes.string.isRequired,
  targetId: PropTypes.string.isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default StyleTransfer;
```

## Best Practices

### 1. Model Selection

- Use appropriate model size for real-time suggestions
- Consider latency requirements
- Balance accuracy vs. response time
- Implement model versioning

### 2. Parameter Validation

- Validate all AI suggestions
- Ensure parameters are within valid ranges
- Handle edge cases gracefully
- Provide fallback values

### 3. User Experience

- Show loading states during AI operations
- Provide clear feedback on suggestions
- Allow easy application of suggestions
- Maintain undo/redo history

### 4. Performance

- Cache common suggestions
- Implement request debouncing
- Use batch processing when appropriate
- Monitor API usage and latency

### 5. Security

- Validate all AI-generated content
- Implement rate limiting
- Protect against prompt injection
- Monitor for abuse

## Testing

### 1. Unit Tests

```python
def test_parameter_validation():
    service = AIService(test_config)

    suggestions = service.get_parameter_suggestions(
        current_parameters=test_parameters,
        user_preferences={},
        creative_goals=[]
    )

    for category, params in suggestions.items():
        for param, value in params.items():
            assert service._is_valid_parameter(category, param, value)

def test_suggestion_history():
    history = ParameterHistory(max_history=5)

    # Add test suggestions
    for i in range(6):
        history.add_suggestions({
            'test': {'value': i}
        })

    # Check max history limit
    assert len(history.history) == 5

    # Check most recent entry
    assert history.history[-1]['suggestions']['test']['value'] == 5

def test_style_transfer():
    service = AIService(test_config)

    transferred = service.transfer_style(
        source_universe_id='test-source',
        target_universe_id='test-target',
        style_strength=0.5
    )

    assert all(
        service._is_valid_parameter(category, param, value)
        for category, params in transferred.items()
        for param, value in params.items()
    )
```

### 2. Integration Tests

```python
def test_ai_suggestion_api():
    client = TestClient(app)

    response = client.post(
        '/api/ai/suggestions',
        json={
            'current_parameters': test_parameters,
            'user_preferences': {},
            'creative_goals': []
        },
        headers={'Authorization': f'Bearer {test_token}'}
    )

    assert response.status_code == 200
    assert response.json()['success'] == True
    assert 'suggestions' in response.json()

def test_style_transfer_api():
    client = TestClient(app)

    response = client.post(
        '/api/ai/style-transfer',
        json={
            'source_universe_id': 'test-source',
            'target_universe_id': 'test-target',
            'style_strength': 0.5
        },
        headers={'Authorization': f'Bearer {test_token}'}
    )

    assert response.status_code == 200
    assert response.json()['success'] == True
    assert 'parameters' in response.json()
```

### 3. Performance Tests

```python
def test_suggestion_latency():
    service = AIService(test_config)

    start_time = time.time()

    suggestions = service.get_parameter_suggestions(
        current_parameters=test_parameters,
        user_preferences={},
        creative_goals=[]
    )

    end_time = time.time()
    latency = end_time - start_time

    assert latency < 1.0  # Maximum 1 second latency

def test_concurrent_requests():
    client = TestClient(app)

    async def make_request():
        return await client.post(
            '/api/ai/suggestions',
            json={
                'current_parameters': test_parameters,
                'user_preferences': {},
                'creative_goals': []
            },
            headers={'Authorization': f'Bearer {test_token}'}
        )

    responses = asyncio.gather(*[
        make_request() for _ in range(10)
    ])

    assert all(
        response.status_code == 200
        for response in responses
    )
```

Last updated: Thu Jan 30 18:37:47 CST 2025
