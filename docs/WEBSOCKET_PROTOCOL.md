# WebSocket Protocol Guide

## Overview

This document details the WebSocket communication protocol used in Harmonic Universe for real-time updates and collaboration.

## Connection

### Authentication

WebSocket connections require JWT authentication. The token should be provided in the connection query parameters:

```javascript
const socket = io('wss://yourdomain.com/ws', {
  query: {
    token: 'your-jwt-token',
  },
});
```

### Connection Events

1. **Connection Success**

```javascript
// Server -> Client
{
  "event": "connect_success",
  "data": {
    "userId": "user-123",
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

2. **Connection Error**

```javascript
// Server -> Client
{
  "event": "connect_error",
  "data": {
    "error": "Invalid token",
    "code": "AUTH_ERROR"
  }
}
```

## Room Management

### Join Room

1. **Request**

```javascript
// Client -> Server
socket.emit('join_room', {
  universeId: 'universe-123',
  mode: 'edit', // or 'view'
});
```

2. **Success Response**

```javascript
// Server -> Client
{
  "event": "room_joined",
  "data": {
    "universeId": "universe-123",
    "participants": [
      {
        "userId": "user-123",
        "username": "john_doe",
        "mode": "edit"
      }
    ],
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

3. **Error Response**

```javascript
// Server -> Client
{
  "event": "room_error",
  "data": {
    "error": "Universe not found",
    "code": "NOT_FOUND"
  }
}
```

### Leave Room

1. **Request**

```javascript
// Client -> Server
socket.emit('leave_room', {
  universeId: 'universe-123',
});
```

2. **Response**

```javascript
// Server -> Client
{
  "event": "room_left",
  "data": {
    "universeId": "universe-123",
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

## Parameter Updates

### Physics Parameters

1. **Update Request**

```javascript
// Client -> Server
socket.emit('update_physics', {
  universeId: 'universe-123',
  parameters: {
    gravity: 9.81,
    friction: 0.5,
    elasticity: 0.7,
    airResistance: 0.1,
    timeScale: 1.0,
  },
});
```

2. **Broadcast**

```javascript
// Server -> All Clients in Room
{
  "event": "physics_updated",
  "data": {
    "universeId": "universe-123",
    "parameters": {
      "gravity": 9.81,
      "friction": 0.5,
      "elasticity": 0.7,
      "airResistance": 0.1,
      "timeScale": 1.0
    },
    "userId": "user-123",
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

### Music Parameters

1. **Update Request**

```javascript
// Client -> Server
socket.emit('update_music', {
  universeId: 'universe-123',
  parameters: {
    harmony: 0.7,
    tempo: 120,
    key: 'C',
    scale: 'major',
    rhythmComplexity: 0.5,
    melodyRange: 0.8,
  },
});
```

2. **Broadcast**

```javascript
// Server -> All Clients in Room
{
  "event": "music_updated",
  "data": {
    "universeId": "universe-123",
    "parameters": {
      "harmony": 0.7,
      "tempo": 120,
      "key": "C",
      "scale": "major",
      "rhythmComplexity": 0.5,
      "melodyRange": 0.8
    },
    "userId": "user-123",
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

### Visualization Parameters

1. **Update Request**

```javascript
// Client -> Server
socket.emit('update_visualization', {
  universeId: 'universe-123',
  parameters: {
    brightness: 0.8,
    saturation: 0.7,
    complexity: 0.6,
    colorScheme: 'rainbow',
    particleCount: 5000,
    glowIntensity: 0.5,
  },
});
```

2. **Broadcast**

```javascript
// Server -> All Clients in Room
{
  "event": "visualization_updated",
  "data": {
    "universeId": "universe-123",
    "parameters": {
      "brightness": 0.8,
      "saturation": 0.7,
      "complexity": 0.6,
      "colorScheme": "rainbow",
      "particleCount": 5000,
      "glowIntensity": 0.5
    },
    "userId": "user-123",
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

## Music Generation

### Request Generation

1. **Request**

```javascript
// Client -> Server
socket.emit('generate_music', {
  universeId: 'universe-123',
  duration: 8, // seconds
});
```

2. **Response**

```javascript
// Server -> All Clients in Room
{
  "event": "music_generated",
  "data": {
    "universeId": "universe-123",
    "notes": [
      {
        "pitch": 60,
        "startTime": 0,
        "duration": 0.5,
        "velocity": 80
      },
      // ... more notes
    ],
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

## Audio Analysis

### Send Analysis

1. **Request**

```javascript
// Client -> Server
socket.emit('audio_analysis', {
  universeId: 'universe-123',
  analysis: {
    frequencies: [
      /* frequency data */
    ],
    waveform: [
      /* waveform data */
    ],
    timestamp: '2024-03-21T10:30:00Z',
  },
});
```

2. **Broadcast**

```javascript
// Server -> All Clients in Room
{
  "event": "audio_analyzed",
  "data": {
    "universeId": "universe-123",
    "analysis": {
      "frequencies": [/* frequency data */],
      "waveform": [/* waveform data */],
      "timestamp": "2024-03-21T10:30:00Z"
    }
  }
}
```

## Participant Management

### Participant Joined

```javascript
// Server -> All Clients in Room
{
  "event": "participant_joined",
  "data": {
    "universeId": "universe-123",
    "participant": {
      "userId": "user-123",
      "username": "john_doe",
      "mode": "edit"
    },
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

### Participant Left

```javascript
// Server -> All Clients in Room
{
  "event": "participant_left",
  "data": {
    "universeId": "universe-123",
    "userId": "user-123",
    "timestamp": "2024-03-21T10:30:00Z"
  }
}
```

## Error Handling

### Common Error Codes

- `AUTH_ERROR`: Authentication failed
- `NOT_FOUND`: Resource not found
- `PERMISSION_DENIED`: Insufficient permissions
- `INVALID_PARAMETERS`: Invalid parameter values
- `ROOM_FULL`: Maximum participants reached
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

### Error Response Format

```javascript
{
  "event": "error",
  "data": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## Rate Limiting

- Maximum 60 parameter updates per minute per client
- Maximum 10 music generation requests per minute per client
- Maximum 30 room join/leave operations per minute per client

## Reconnection

### Automatic Reconnection

The client should implement exponential backoff for reconnection attempts:

```javascript
const socket = io('wss://yourdomain.com/ws', {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
});
```

### State Recovery

Upon reconnection, the server will automatically:

1. Rejoin the client to their previous room
2. Send current parameter values
3. Send current participant list
4. Send any missed updates that occurred during disconnection

## Performance Considerations

1. **Message Size**

   - Keep messages under 16KB when possible
   - Use compression for larger payloads
   - Batch updates when appropriate

2. **Update Frequency**

   - Throttle rapid parameter updates
   - Implement debouncing on the client side
   - Use delta updates for large datasets

3. **Connection Management**
   - Implement heartbeat mechanism
   - Monitor connection quality
   - Handle disconnections gracefully

## Security Considerations

1. **Authentication**

   - Use secure WebSocket (WSS)
   - Validate JWT on every message
   - Implement token refresh mechanism

2. **Authorization**

   - Verify universe access permissions
   - Validate edit/view modes
   - Check rate limits per user

3. **Data Validation**
   - Validate all incoming messages
   - Sanitize user input
   - Implement message size limits

## Debugging

### Client-side Logging

```javascript
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('connect_error', error => {
  console.error('Connection error:', error);
});

// Enable debug mode
const socket = io('wss://yourdomain.com/ws', {
  debug: true,
});
```

### Server-side Logging

```python
@socketio.on_error()
def error_handler(e):
    logger.error(f"WebSocket error: {str(e)}")
    return {"error": str(e)}
```

## Best Practices

1. **Connection Management**

   - Implement proper cleanup on component unmount
   - Handle reconnection gracefully
   - Monitor connection state

2. **Error Handling**

   - Implement comprehensive error handling
   - Provide meaningful error messages
   - Log errors appropriately

3. **Performance**

   - Batch updates when possible
   - Implement debouncing
   - Monitor message sizes

4. **Testing**
   - Test reconnection scenarios
   - Verify error handling
   - Test with various network conditions
