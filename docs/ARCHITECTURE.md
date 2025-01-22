# Harmonic Universe Architecture

## System Overview

Harmonic Universe is a real-time interactive application that combines physics simulation, music generation, and visualization. The system is built using a microservices-inspired architecture with the following main components:

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  React Frontend │◄────┤ WebSocket Server │────►│ Flask Backend  │
└─────────────────┘     └──────────────────┘     └────────────────┘
         ▲                       ▲                        ▲
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Redux Store    │     │ Event Bus        │     │   Database     │
└─────────────────┘     └──────────────────┘     └────────────────┘
```

## Core Components

### Frontend Architecture

1. **React Components**

   - `UniverseBuilderPage`: Main universe creation/editing interface
   - `PhysicsControls`: Physics parameter management
   - `MusicControls`: Music parameter management
   - `VisualizationControls`: Visualization parameter management

2. **State Management**

   - Redux store with slices for:
     - Universe state
     - Physics parameters
     - Music parameters
     - Visualization parameters
     - WebSocket connection state
     - User authentication

3. **WebSocket Client**
   - Manages real-time connections
   - Handles parameter synchronization
   - Manages collaboration features

### Backend Architecture

1. **Flask Application**

   - RESTful API endpoints
   - WebSocket server
   - Authentication middleware
   - Parameter validation
   - Database models and migrations

2. **Services**

   - `PhysicsService`: Physics simulation calculations
   - `MusicService`: Music generation and audio processing
   - `VisualizationService`: Particle system and rendering
   - `AIService`: Parameter optimization and suggestions
   - `WebSocketService`: Real-time communication management

3. **Database Models**
   - `User`: User authentication and profiles
   - `Universe`: Core universe properties
   - `PhysicsParameters`: Physics simulation settings
   - `MusicParameters`: Music generation settings
   - `VisualizationParameters`: Visual rendering settings

## Model Layer

### Core Models

#### Universe

- Primary model representing a user's created universe
- Properties:
  - Basic: id, name, description, is_public
  - Timestamps: created_at, updated_at
  - Relations: user_id, template_id
- Relationships:
  - User (owner)
  - Template (base template)
  - PhysicsParameters (1:1)
  - MusicParameters (1:1)
  - AudioParameters (1:1)
  - VisualizationParameters (1:1)
  - Comments (1:many)
  - Favorites (many:many with User)
  - Storyboards (1:many)

#### Parameters

1. Physics Parameters

   - Gravity
   - Particle behavior
   - Motion dynamics
   - Affects music tempo and audio volume

2. Music Parameters

   - Tempo (influenced by gravity)
   - Key
   - Scale
   - Note generation
   - Affects audio pitch

3. Audio Parameters

   - Volume (influenced by physics)
   - Pitch (influenced by music)
   - Sound effects
   - Ambient sounds

4. Visualization Parameters
   - Color schemes
   - Particle effects
   - Visual dynamics
   - Animation settings

### Supporting Models

#### User

- Authentication and profile
- Universe ownership
- Preferences and settings
- Favorite universes

#### Template

- Pre-defined universe configurations
- Base settings for new universes
- Customization options

#### Storyboard

- Sequence of universe states
- Timeline management
- State transitions

#### Comments

- User feedback
- Discussion threads
- Universe reviews

#### Favorites

- User bookmarks
- Popular universes tracking
- Quick access management

## Data Flow

### Parameter Relationships

1. Physics → Music

   - Gravity affects tempo
   - Particle behavior influences rhythm

2. Music → Audio

   - Tempo affects pitch
   - Scale determines sound palette

3. Audio → Physics

   - Volume influences gravity
   - Sound patterns affect particle behavior

4. All → Visualization
   - Physics affects particle rendering
   - Music influences color patterns
   - Audio impacts visual effects

## AI Integration

### Parameter Generation

- AI-powered suggestions for parameters
- Context-aware recommendations
- Style transfer between universes

### Music Generation

- Dynamic note generation
- Harmony optimization
- Rhythm patterns based on physics

## Real-time Updates

### WebSocket Protocol

- Live parameter updates
- Collaborative editing
- State synchronization
- Real-time visualization

## Security

### Access Control

- Public/Private universes
- User authentication
- Permission management
- API rate limiting

### Data Protection

- Secure parameter storage
- User data encryption
- Safe template sharing

## Performance

### Optimization

- Efficient parameter calculations
- Cached visualization states
- Optimized audio processing
- Background task handling

## Development Workflow

1. **Local Development**

   ```bash
   # Terminal 1 - Backend
   cd backend
   ./setup.sh
   flask run

   # Terminal 2 - Frontend
   cd frontend
   npm install
   npm run dev
   ```

2. **Testing**

   ```bash
   # Run all tests
   ./test_runner.sh

   # Run specific tests
   cd backend && pytest tests/unit
   cd frontend && npm test
   ```

## Deployment

1. **Production Setup**

   - PostgreSQL database
   - Redis for caching
   - NGINX reverse proxy
   - SSL/TLS configuration

2. **Scaling Considerations**
   - Horizontal scaling of WebSocket servers
   - Database replication
   - Load balancing
   - CDN for static assets

## Monitoring

1. **Metrics**

   - WebSocket connection count
   - Parameter update frequency
   - Response times
   - Error rates

2. **Logging**
   - Application logs
   - WebSocket events
   - Performance metrics
   - Error tracking

## Future Considerations

1. **Planned Features**

   - Mobile support
   - Offline mode
   - Extended AI capabilities
   - Advanced visualization effects

2. **Technical Debt**
   - Performance optimization
   - Test coverage
   - Documentation updates
   - Code refactoring
