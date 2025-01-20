# Harmonic Universe API Documentation

## Overview

The Harmonic Universe API provides endpoints for managing universes with integrated physics simulation, music generation, and visualization parameters. All these systems work together to create a harmonious, interactive experience.

## Base URL

```
https://harmonic-universe-api.onrender.com/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Rate Limits

- 100 requests per minute per IP
- 1000 requests per hour per user
- WebSocket connections limited to 5 per user

## Endpoints

### Authentication

#### POST /auth/register

Register a new user.

```json
Request:
{
  "username": "string",
  "email": "string",
  "password": "string"
}

Response:
{
  "id": "string",
  "username": "string",
  "email": "string",
  "token": "string"
}
```

#### POST /auth/login

Login with existing credentials.

```json
Request:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "id": "string",
  "username": "string",
  "email": "string",
  "token": "string"
}
```

### Universes

#### GET /universes

Get all universes accessible to the user.

```json
Response:
{
  "universes": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "is_public": boolean,
      "user_id": "string",
      "created_at": "string",
      "updated_at": "string",
      "physics_parameters": {
        "gravity": number,
        "friction": number,
        "elasticity": number,
        "airResistance": number,
        "density": number
      },
      "music_parameters": {
        "harmony": number,
        "tempo": number,
        "key": "string",
        "scale": "string"
      },
      "visualization_parameters": {
        "brightness": number,
        "saturation": number,
        "complexity": number,
        "colorScheme": "string"
      }
    }
  ]
}
```

#### POST /universes

Create a new universe.

```json
Request:
{
  "name": "string",
  "description": "string",
  "is_public": boolean,
  "physics_parameters": {
    "gravity": number,         // Range: 0-20
    "friction": number,        // Range: 0-1
    "elasticity": number,      // Range: 0-1
    "air_resistance": number,  // Range: 0-1
    "density": number,         // Range: 0-5
    "time_scale": number      // Range: 0.1-2
  },
  "music_parameters": {
    "harmony": number,           // Range: 0-1
    "tempo": number,            // Range: 40-200
    "key": string,             // Valid keys: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    "scale": string,           // Valid scales: major, minor, harmonic minor, melodic minor, pentatonic, blues
    "rhythm_complexity": number, // Range: 0-1
    "melody_range": number      // Range: 0-1
  },
  "visualization_parameters": {
    "brightness": number,       // Range: 0-1
    "saturation": number,       // Range: 0-1
    "complexity": number,       // Range: 0-1
    "color_scheme": string,     // Valid schemes: rainbow, monochrome, complementary, analogous, triadic, custom
    "background_color": string, // Hex color code
    "particle_color": string,   // Hex color code
    "glow_color": string,      // Hex color code
    "particle_count": number,   // Range: 100-10000
    "particle_size": number,    // Range: 0.1-10
    "particle_speed": number,   // Range: 0.1-5
    "glow_intensity": number,   // Range: 0-1
    "blur_amount": number,      // Range: 0-1
    "trail_length": number,     // Range: 0-1
    "animation_speed": number,  // Range: 0.1-5
    "bounce_factor": number,    // Range: 0-1
    "rotation_speed": number,   // Range: -5-5
    "camera_zoom": number,      // Range: 0.1-5
    "camera_rotation": number   // Range: 0-360
  }
}

Response:
{
  "id": "string",
  "name": "string",
  "description": "string",
  "is_public": boolean,
  "user_id": "string",
  "created_at": "string",
  "physics_parameters": {...},
  "music_parameters": {...},
  "visualization_parameters": {...}
}
```

#### PUT /universes/:id

Update an existing universe.

```json
Request:
{
  "name": "string",
  "description": "string",
  "is_public": boolean,
  "physics_parameters": {...},
  "music_parameters": {...},
  "visualization_parameters": {...}
}

Response:
{
  "id": "string",
  "name": "string",
  "description": "string",
  "is_public": boolean,
  "user_id": "string",
  "updated_at": "string",
  "physics_parameters": {...},
  "music_parameters": {...},
  "visualization_parameters": {...}
}
```

#### DELETE /universes/:id

Delete a universe.

```json
Response:
{
  "message": "Universe deleted successfully"
}
```

### Parameter Updates

#### PATCH /universes/:id/physics

Update physics parameters.

```json
Request:
{
  "gravity": number,
  "friction": number,
  "elasticity": number,
  "airResistance": number,
  "density": number
}

Response:
{
  "physics_parameters": {...},
  "music_parameters": {...},    // Updated based on physics changes
  "visualization_parameters": {...}  // Updated based on physics changes
}
```

#### PATCH /universes/:id/music

Update music parameters.

```json
Request:
{
  "harmony": number,
  "tempo": number,
  "key": "string",
  "scale": "string"
}

Response:
{
  "music_parameters": {...},
  "visualization_parameters": {...}  // Updated based on music changes
}
```

#### PATCH /universes/:id/visualization

Update visualization parameters.

```json
Request:
{
  "brightness": number,
  "saturation": number,
  "complexity": number,
  "colorScheme": "string"
}

Response:
{
  "visualization_parameters": {...}
}
```

### Real-time Updates

Connect to WebSocket endpoint:

```
wss://harmonic-universe-api.onrender.com/ws
```

#### Connection

```json
// Client -> Server
{
  "type": "connect",
  "data": {
    "token": "string"  // JWT token for authentication
  }
}

// Server -> Client
{
  "type": "connect_success",
  "data": {
    "user_id": "string"
  }
}
```

#### Join Room

```json
// Client -> Server
{
  "type": "join_room",
  "data": {
    "universe_id": "string",
    "mode": "string"  // "view" or "edit"
  }
}

// Server -> Client
{
  "type": "room_joined",
  "data": {
    "universe_id": "string",
    "participants": [
      {
        "user_id": "string",
        "username": "string",
        "mode": "string"
      }
    ]
  }
}
```

#### Parameter Updates

```json
// Client -> Server
{
  "type": "parameter_update",
  "data": {
    "universe_id": "string",
    "parameter_type": "string",  // "physics", "music", or "visualization"
    "parameters": object
  }
}

// Server -> Client
{
  "type": "parameters_updated",
  "data": {
    "universe_id": "string",
    "physics_parameters": object,
    "music_parameters": object,
    "visualization_parameters": object
  }
}
```

#### Music Generation

```json
// Client -> Server
{
  "type": "music_generation",
  "data": {
    "universe_id": "string"
  }
}

// Server -> Client
{
  "type": "music_generated",
  "data": {
    "universe_id": "string",
    "notes": [
      {
        "pitch": number,
        "startTime": number,
        "duration": number,
        "velocity": number
      }
    ],
    "tempo": number,
    "key": string,
    "scale": string
  }
}
```

#### Audio Analysis

```json
// Client -> Server
{
  "type": "audio_analysis",
  "data": {
    "universe_id": "string",
    "frequencies": number[],
    "amplitudes": number[]
  }
}

// Server -> Client
{
  "type": "visualization_update",
  "data": {
    "universe_id": "string",
    "particles": [
      {
        "id": string,
        "position": { "x": number, "y": number, "z": number },
        "velocity": { "x": number, "y": number, "z": number },
        "color": string,
        "size": number
      }
    ]
  }
}
```

#### Error Responses

```json
{
  "type": "error",
  "data": {
    "code": string,    // Error code
    "message": string, // Human-readable error message
    "details": object  // Additional error details if available
  }
}
```

### AI Integration

#### POST /universes/:id/ai/suggest

Get AI suggestions for parameter optimization.

```json
Request:
{
  "target": "string",  // "physics" | "music" | "visualization"
  "constraints": {
    "min_gravity": number,
    "max_tempo": number,
    // ... other constraints
  }
}

Response:
{
  "suggestions": {
    "physics_parameters": {...},
    "music_parameters": {...},
    "visualization_parameters": {...}
  },
  "explanation": "string"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

```json
{
  "error": "string",
  "message": "string",
  "status": number
}
```

Common status codes:

- 400: Bad Request (Invalid parameters)
- 401: Unauthorized (Missing/invalid token)
- 403: Forbidden (Insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Parameter Constraints

### Physics Parameters

- gravity: 0 to 20 m/s²
- friction: 0 to 1
- elasticity: 0 to 1
- airResistance: 0 to 1
- density: 0 to 5 kg/m³

### Music Parameters

- harmony: 0 to 1
- tempo: 40 to 200 BPM
- key: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
- scale: major, minor, harmonic minor, melodic minor, pentatonic, blues

### Visualization Parameters

- brightness: 0 to 1
- saturation: 0 to 1
- complexity: 0 to 1
- colorScheme: rainbow, monochrome, complementary, analogous, triadic, custom

## WebSocket Limits

- Maximum connections per user: 5
- Message size limit: 100KB
- Heartbeat interval: 30 seconds
- Reconnection attempts: 5 with exponential backoff
