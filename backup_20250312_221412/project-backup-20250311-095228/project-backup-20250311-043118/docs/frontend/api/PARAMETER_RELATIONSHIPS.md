# Parameter Relationships

## Overview

This document describes the relationships and interactions between different parameters in the Harmonic Universe system.

## Core Parameter Types

### 1. Physics Parameters

```python
class PhysicsParameters:
    - gravity: float            # Range: 1.0 - 20.0
    - particle_speed: float     # Range: 0.0 - 100.0
    - particle_size: float      # Range: 0.1 - 10.0
    - friction: float          # Range: 0.0 - 1.0
    - elasticity: float        # Range: 0.0 - 1.0
```

### 2. Music Parameters

```python
class MusicParameters:
    - tempo: int               # Range: 40 - 200 BPM
    - key: str                 # Values: C, C#, D, etc.
    - scale: str              # Values: major, minor, etc.
    - harmony_complexity: int  # Range: 1 - 10
```

### 3. Audio Parameters

```python
class AudioParameters:
    - volume: float           # Range: 0.0 - 1.0
    - pitch: float           # Range: 0.0 - 1.0
    - reverb: float         # Range: 0.0 - 1.0
    - delay: float          # Range: 0.0 - 1.0
```

### 4. Visualization Parameters

```python
class VisualizationParameters:
    - color_scheme: str       # Values: spectrum, monochrome, etc.
    - particle_effect: str    # Values: glow, trail, etc.
    - background_style: str   # Values: gradient, solid, etc.
    - animation_speed: float  # Range: 0.1 - 10.0
```

## Parameter Interactions

### Physics → Music

1. Gravity affects Tempo

   ```python
   tempo = min(200, max(40, int(120 * (gravity / 9.81))))
   ```

   - Higher gravity increases tempo
   - Base gravity (9.81) maps to 120 BPM
   - Range is clamped between 40-200 BPM

2. Particle Behavior affects Rhythm
   - Particle speed influences note duration
   - Collision events trigger percussion
   - Particle density affects note frequency

### Music → Audio

1. Tempo affects Pitch

   ```python
   pitch = min(1.0, max(0.0, (tempo - 40) / 160))
   ```

   - Faster tempo increases pitch
   - Normalized to 0.0-1.0 range
   - Base tempo (120) maps to 0.5 pitch

2. Scale affects Sound Design
   - Major scales use brighter timbres
   - Minor scales use darker timbres
   - Modal scales affect harmony complexity

### Audio → Physics

1. Volume affects Gravity

   ```python
   gravity = min(20.0, max(1.0, 9.81 * (volume * 20)))
   ```

   - Higher volume increases gravity
   - Normalized from audio volume (0-1) to gravity range
   - Maintains physical realism constraints

2. Audio Features affect Particles
   - Bass frequencies affect particle size
   - Mid frequencies affect particle speed
   - High frequencies affect particle effects

### All → Visualization

1. Physics affects Rendering

   - Gravity influences color brightness
   - Particle speed affects trail length
   - Collision energy affects particle glow

2. Music affects Colors

   - Key determines base color
   - Scale affects color palette
   - Tempo affects animation speed

3. Audio affects Effects
   - Volume affects overall intensity
   - Frequency spectrum maps to color distribution
   - Beat detection triggers visual events

## AI Integration

### Parameter Generation

The system uses AI to suggest parameter combinations:

```python
def get_ai_suggestions(universe_id, target, constraints=None):
    return {
        'physics': {...},
        'music': {...},
        'audio': {...},
        'visualization': {...}
    }
```

### Style Transfer

AI can transfer parameter styles between universes:

```python
def transfer_style(source_universe, target_universe, aspects=['physics', 'music']):
    # AI analyzes source universe parameters
    # Generates matching parameters for target
    # Maintains physical consistency
    pass
```

## Real-time Updates

### WebSocket Events

1. Parameter Update Event

   ```json
   {
     "type": "parameter_update",
     "category": "physics",
     "property": "gravity",
     "value": 15.0,
     "timestamp": "2024-01-22T12:00:00Z"
   }
   ```

2. State Sync Event
   ```json
   {
     "type": "state_sync",
     "universe_id": "123",
     "parameters": {
       "physics": {...},
       "music": {...},
       "audio": {...},
       "visualization": {...}
     }
   }
   ```

## Optimization

### Caching Strategy

- Parameter calculations are cached
- Real-time updates use delta compression
- Visualization states are pre-computed
- Audio processing uses WebAssembly

### Performance Considerations

1. Update Frequency

   - Physics: 60 Hz
   - Music: On beat changes
   - Audio: Real-time (WebAudio API)
   - Visualization: Frame-based (60 FPS)

2. Resource Management
   - Batch parameter updates
   - Use WebWorkers for calculations
   - Implement memory pooling
   - Optimize garbage collection

Last updated: Thu Jan 30 18:37:48 CST 2025
