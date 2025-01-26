# API Documentation

## Overview

This document describes the REST API endpoints and WebSocket events for the Harmonic Universe application.

## Authentication

### JWT Authentication

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
```

## Universe Management

### Universe CRUD Operations

```
GET    /api/universes
POST   /api/universes
GET    /api/universes/:id
PUT    /api/universes/:id
DELETE /api/universes/:id
```

### Universe Parameters

```
GET    /api/universes/:id/parameters
PUT    /api/universes/:id/parameters/physics
PUT    /api/universes/:id/parameters/music
PUT    /api/universes/:id/parameters/audio
PUT    /api/universes/:id/parameters/visualization
```

### Universe Templates

```
GET    /api/templates
POST   /api/templates
GET    /api/templates/:id
PUT    /api/templates/:id
DELETE /api/templates/:id
```

### Universe Sharing

```
POST   /api/universes/:id/share
DELETE /api/universes/:id/share/:userId
GET    /api/universes/:id/collaborators
```

## Parameter Management

### Physics Parameters

```json
{
  "gravity": 9.81,
  "particle_speed": 50.0,
  "particle_size": 1.0,
  "friction": 0.5,
  "elasticity": 0.7
}
```

### Music Parameters

```json
{
  "tempo": 120,
  "key": "C",
  "scale": "major",
  "harmony_complexity": 5
}
```

### Audio Parameters

```json
{
  "volume": 0.8,
  "pitch": 0.5,
  "reverb": 0.3,
  "delay": 0.2
}
```

### Visualization Parameters

```json
{
  "color_scheme": "spectrum",
  "particle_effect": "glow",
  "background_style": "gradient",
  "animation_speed": 1.0
}
```

## Real-time Communication

### WebSocket Events

1. Connection

```javascript
socket.on('connect', () => {
  socket.emit('join_universe', { universe_id: 'xxx' });
});
```

2. Parameter Updates

```javascript
socket.emit('parameter_update', {
  universe_id: 'xxx',
  category: 'physics',
  parameters: {
    gravity: 15.0,
  },
});
```

3. State Sync

```javascript
socket.on('state_sync', data => {
  // Full universe state
});
```

## AI Integration

### Parameter Suggestions

```
GET /api/ai/suggestions/:universe_id
POST /api/ai/suggestions/:universe_id/apply
```

### Style Transfer

```
POST /api/ai/transfer
Body: {
  source_universe_id: "xxx",
  target_universe_id: "yyy",
  aspects: ["physics", "music"]
}
```

## Social Features

### Comments

```
GET    /api/universes/:id/comments
POST   /api/universes/:id/comments
PUT    /api/comments/:id
DELETE /api/comments/:id
```

### Favorites

```
POST   /api/universes/:id/favorite
DELETE /api/universes/:id/favorite
GET    /api/users/:id/favorites
```

### User Profiles

```
GET    /api/users/:id
PUT    /api/users/:id
GET    /api/users/:id/universes
```

## Data Models

### Universe Model

```python
class Universe:
    id: int
    name: str
    description: str
    is_public: bool
    user_id: int
    template_id: int
    created_at: datetime
    updated_at: datetime

    # Relationships
    physics_parameters: PhysicsParameters
    music_parameters: MusicParameters
    audio_parameters: AudioParameters
    visualization_parameters: VisualizationParameters
    comments: List[Comment]
    favorites: List[Favorite]
    storyboards: List[Storyboard]
```

### User Model

```python
class User:
    id: int
    username: str
    email: str
    created_at: datetime

    # Relationships
    universes: List[Universe]
    favorite_universes: List[Universe]
    comments: List[Comment]
    preferences: UserPreferences
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "specific error details"
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Permission denied
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Rate Limiting

### Limits

- API: 100 requests per minute per user
- WebSocket: 60 events per minute per connection
- AI endpoints: 10 requests per minute per user

### Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1516131940
```

## Versioning

### API Versioning

All endpoints are prefixed with API version:

```
/api/v1/universes
```

### Response Headers

```
API-Version: 1.0
```

## WebSocket Protocol

### Connection

```javascript
const socket = io('wss://api.harmonic-universe.com', {
  auth: {
    token: 'JWT_TOKEN',
  },
});
```

### Events

1. Universe Events

   - `universe:join`
   - `universe:leave`
   - `universe:update`
   - `universe:sync`

2. Parameter Events

   - `parameter:update`
   - `parameter:sync`
   - `parameter:reset`

3. Collaboration Events

   - `collaboration:join`
   - `collaboration:leave`
   - `collaboration:cursor`

4. System Events
   - `system:error`
   - `system:notification`
   - `system:maintenance`
