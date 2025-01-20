# Parameter Relationships Guide

## Overview

This document explains how physics, music, and visualization parameters interact in Harmonic Universe to create a cohesive, synchronized experience.

## Parameter Categories

### Physics Parameters

| Parameter     | Range      | Description                                     |
| ------------- | ---------- | ----------------------------------------------- |
| gravity       | 0.0 - 20.0 | Gravitational force affecting particle movement |
| friction      | 0.0 - 1.0  | Surface friction between particles              |
| elasticity    | 0.0 - 1.0  | Bounciness of particle collisions               |
| airResistance | 0.0 - 1.0  | Air resistance affecting particle movement      |
| timeScale     | 0.1 - 5.0  | Speed of physics simulation                     |

### Music Parameters

| Parameter        | Range              | Description                   |
| ---------------- | ------------------ | ----------------------------- |
| harmony          | 0.0 - 1.0          | Consonance of generated music |
| tempo            | 60 - 180           | Beats per minute              |
| key              | C, C#, D, etc.     | Musical key                   |
| scale            | major, minor, etc. | Musical scale                 |
| rhythmComplexity | 0.0 - 1.0          | Complexity of rhythm patterns |
| melodyRange      | 0.0 - 1.0          | Range of melody notes         |

### Visualization Parameters

| Parameter     | Range        | Description                          |
| ------------- | ------------ | ------------------------------------ |
| brightness    | 0.0 - 1.0    | Overall brightness of particles      |
| saturation    | 0.0 - 1.0    | Color saturation of particles        |
| complexity    | 0.0 - 1.0    | Visual complexity of particle system |
| colorScheme   | string       | Color palette for particles          |
| particleCount | 1000 - 10000 | Number of particles                  |
| glowIntensity | 0.0 - 1.0    | Intensity of particle glow           |

## Parameter Interactions

### Physics → Music

1. **Gravity → Tempo**

   - Higher gravity (> 10.0) increases tempo (up to 180 BPM)
   - Lower gravity (< 5.0) decreases tempo (down to 60 BPM)

   ```javascript
   tempo = 60 + (gravity / 20.0) * 120;
   ```

2. **Friction → Harmony**

   - Higher friction (> 0.7) increases harmony (more consonant)
   - Lower friction (< 0.3) decreases harmony (more dissonant)

   ```javascript
   harmony = friction;
   ```

3. **Elasticity → Rhythm Complexity**

   - Higher elasticity (> 0.7) increases rhythm complexity
   - Lower elasticity (< 0.3) simplifies rhythm

   ```javascript
   rhythmComplexity = elasticity;
   ```

4. **Air Resistance → Melody Range**

   - Higher air resistance (> 0.7) narrows melody range
   - Lower air resistance (< 0.3) widens melody range

   ```javascript
   melodyRange = 1.0 - airResistance;
   ```

5. **Time Scale → Note Duration**
   - Higher time scale (> 2.0) shortens note durations
   - Lower time scale (< 0.5) lengthens note durations
   ```javascript
   noteDuration = 1.0 / timeScale;
   ```

### Physics → Visualization

1. **Gravity → Particle Movement**

   - Higher gravity creates faster downward movement
   - Lower gravity allows for more floating particles

   ```javascript
   particleVelocity.y -= gravity * deltaTime;
   ```

2. **Friction → Particle Trail Length**

   - Higher friction shortens particle trails
   - Lower friction lengthens particle trails

   ```javascript
   trailLength = (1.0 - friction) * maxTrailLength;
   ```

3. **Elasticity → Particle Size**

   - Higher elasticity increases particle size variation
   - Lower elasticity maintains consistent particle sizes

   ```javascript
   particleSize = baseSize * (1.0 + elasticity * random());
   ```

4. **Air Resistance → Particle Spread**

   - Higher air resistance clusters particles
   - Lower air resistance allows wider particle spread

   ```javascript
   particleSpread = (1.0 - airResistance) * maxSpread;
   ```

5. **Time Scale → Animation Speed**
   - Higher time scale increases animation speed
   - Lower time scale slows animation
   ```javascript
   animationSpeed = baseSpeed * timeScale;
   ```

### Music → Visualization

1. **Tempo → Particle Pulsation**

   - Faster tempo increases pulsation frequency
   - Slower tempo decreases pulsation frequency

   ```javascript
   pulsationFrequency = tempo / 60.0;
   ```

2. **Harmony → Color Harmony**

   - Higher harmony uses more analogous colors
   - Lower harmony uses more contrasting colors

   ```javascript
   colorVariation = (1.0 - harmony) * maxColorVariation;
   ```

3. **Key → Base Color**

   - Each key maps to a specific base color
   - Color wheel mapping (C = red, G = green, etc.)

   ```javascript
   baseColor = keyColorMap[key];
   ```

4. **Scale → Color Scheme**

   - Major scales use warmer colors
   - Minor scales use cooler colors

   ```javascript
   colorTemperature = scale === 'major' ? 'warm' : 'cool';
   ```

5. **Rhythm Complexity → Particle Emission**
   - Higher complexity increases emission variation
   - Lower complexity maintains steady emission
   ```javascript
   emissionRate = baseRate * (1.0 + rhythmComplexity * sin(time));
   ```

## Dynamic Updates

### Real-time Parameter Synchronization

1. **Physics Updates**

```javascript
function updatePhysics(parameters) {
  // Update physics parameters
  world.gravity = parameters.gravity;
  world.friction = parameters.friction;

  // Update dependent music parameters
  const musicParams = calculateMusicParameters(parameters);
  updateMusic(musicParams);

  // Update dependent visualization parameters
  const visualParams = calculateVisualizationParameters(parameters);
  updateVisualization(visualParams);
}
```

2. **Music Updates**

```javascript
function updateMusic(parameters) {
  // Update music parameters
  musicSystem.harmony = parameters.harmony;
  musicSystem.tempo = parameters.tempo;

  // Update dependent visualization parameters
  const visualParams = calculateVisualizationFromMusic(parameters);
  updateVisualization(visualParams);
}
```

3. **Visualization Updates**

```javascript
function updateVisualization(parameters) {
  // Update visualization parameters
  renderer.brightness = parameters.brightness;
  renderer.particleCount = parameters.particleCount;

  // Apply physics-based modifications
  applyPhysicsToVisualization(parameters);

  // Apply music-based modifications
  applyMusicToVisualization(parameters);
}
```

## Performance Optimization

### Parameter Update Batching

```javascript
class ParameterManager {
  private updateQueue = new Map();
  private updateTimeout: number | null = null;

  queueUpdate(type: string, parameters: any) {
    this.updateQueue.set(type, parameters);

    if (!this.updateTimeout) {
      this.updateTimeout = setTimeout(() => {
        this.processUpdates();
      }, 16); // ~60fps
    }
  }

  private processUpdates() {
    // Process physics first
    if (this.updateQueue.has('physics')) {
      updatePhysics(this.updateQueue.get('physics'));
    }

    // Then music
    if (this.updateQueue.has('music')) {
      updateMusic(this.updateQueue.get('music'));
    }

    // Finally visualization
    if (this.updateQueue.has('visualization')) {
      updateVisualization(this.updateQueue.get('visualization'));
    }

    this.updateQueue.clear();
    this.updateTimeout = null;
  }
}
```

### Parameter Interpolation

```javascript
class ParameterInterpolator {
  private currentValues: Record<string, number> = {};
  private targetValues: Record<string, number> = {};

  interpolate(deltaTime: number) {
    for (const [param, target] of Object.entries(this.targetValues)) {
      const current = this.currentValues[param];
      const diff = target - current;

      if (Math.abs(diff) < 0.001) {
        this.currentValues[param] = target;
      } else {
        this.currentValues[param] += diff * deltaTime * 5;
      }
    }
  }
}
```

## Best Practices

1. **Parameter Updates**

   - Batch related parameter updates
   - Use debouncing for rapid changes
   - Implement smooth transitions

2. **Performance**

   - Cache calculated relationships
   - Use efficient data structures
   - Optimize update frequency

3. **Synchronization**

   - Maintain consistent update order
   - Handle parameter dependencies
   - Validate parameter ranges

4. **Testing**
   - Test extreme parameter values
   - Verify relationship calculations
   - Check update performance
