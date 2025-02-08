# Frontend Documentation

## Overview

The frontend of Harmonic Universe is built with React and provides an immersive interface for creating and experiencing audio-visual universes. It integrates with Three.js for 3D rendering, Tone.js for audio synthesis, and WebGL for advanced graphics processing.

## Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ai/
│   │   │   └── MusicGenerator.jsx
│   │   ├── audio/
│   │   │   └── AudioAnalyzer.jsx
│   │   ├── physics/
│   │   │   └── PhysicsSystem.js
│   │   ├── universe/
│   │   │   └── UniverseHarmony.jsx
│   │   └── visualization/
│   │       ├── PhysicsVisualization.jsx
│   │       ├── SpectrumVisualization.jsx
│   │       └── effects/
│   ├── hooks/
│   │   ├── useAudioAnalyzer.js
│   │   └── usePhysicsSystem.js
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── audioSlice.js
│   │   │   ├── physicsSlice.js
│   │   │   └── visualizationSlice.js
│   │   └── index.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── UniverseDetail.jsx
│   │   └── Home.jsx
│   └── services/
│       ├── api.js
│       └── websocket.js
└── public/
    └── assets/
```

## Key Components

### Universe Components

- UniverseHarmony: Manages universe parameters and harmony generation
- UniverseDetail: Displays detailed universe information and controls
- Dashboard: Main interface for universe management

### Physics Components

- PhysicsSystem: Handles particle physics simulation
- PhysicsVisualization: Renders physics-based visual effects
- Force field management and collision detection

### Audio Components

- MusicGenerator: AI-powered music generation interface
- AudioAnalyzer: Real-time audio analysis and visualization
- Audio parameter controls and effect processing

### Visualization Components

- SpectrumVisualization: Frequency spectrum display
- WaveformVisualization: Time-domain audio visualization
- Effect components for post-processing and special effects

## State Management

### Redux Store Structure

```javascript
{
  auth: {
    user: Object,
    isAuthenticated: boolean,
    loading: boolean
  },
  universe: {
    currentUniverse: Object,
    universes: Array,
    loading: boolean
  },
  audio: {
    tracks: Array,
    effects: Array,
    analyzing: boolean
  },
  physics: {
    objects: Array,
    parameters: Object,
    simulation: Object
  },
  visualization: {
    settings: Object,
    effects: Array,
    rendering: boolean
  }
}
```

### Slices

- authSlice: Authentication state and user management
- universeSlice: Universe data and parameters
- audioSlice: Audio processing and analysis
- physicsSlice: Physics simulation state
- visualizationSlice: Rendering settings and effects

## Real-time Features

### WebSocket Integration

- Live parameter updates
- Physics state synchronization
- Audio analysis streaming
- Collaborative features

### WebGL Rendering

- Three.js integration
- Custom shaders
- Post-processing effects
- Performance optimization

## User Interface

### Dashboard

- Universe management interface
- Parameter controls
- Real-time visualization
- Audio controls

### Universe Editor

- Physics parameter adjustment
- Harmony settings
- Visual effect controls
- Preview functionality

### Audio Interface

- Music generation controls
- Effect parameters
- Analysis visualization
- Playback controls

## Development

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Modern web browser with WebGL support

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Environment Variables

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws
VITE_AUTH_TOKEN_KEY=harmonic_universe_token
```

## Testing

### Unit Tests

- Component testing with Jest
- Redux state testing
- Utility function testing

### Integration Tests

- API integration tests
- WebSocket communication
- State management flow

### Performance Testing

- Rendering performance
- Audio processing
- Physics simulation
- Memory management

## Deployment

### Build Process

- Asset optimization
- Code splitting
- Cache management
- Environment configuration

### Performance Optimization

- Lazy loading
- Code splitting
- Asset optimization
- Caching strategies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

### Core

- React
- Redux Toolkit
- Three.js
- Tone.js
- Material-UI

### Development

- Vite
- TypeScript
- ESLint
- Prettier
- Jest

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines and contribution process.
