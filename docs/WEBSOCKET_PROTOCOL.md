# WebSocket Protocol

## Overview

The Harmonic Universe WebSocket protocol enables real-time communication between clients and the server for parameter updates, collaboration, and state synchronization.

## Connection

### Establishing Connection

```javascript
const socket = io('wss://api.harmonic-universe.com', {
  auth: {
    token: 'JWT_TOKEN',
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### Connection Events

```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', reason => {
  console.log('Disconnected:', reason);
});

socket.on('error', error => {
  console.error('WebSocket error:', error);
});
```

## Universe Events

### Join Universe

```javascript
// Client -> Server
socket.emit('universe:join', {
  universe_id: 'xxx',
  user_id: 'yyy',
});

// Server -> Client
socket.on('universe:joined', data => {
  const { universe, participants } = data;
});
```

### Leave Universe

```javascript
// Client -> Server
socket.emit('universe:leave', {
  universe_id: 'xxx',
  user_id: 'yyy',
});

// Server -> Client
socket.on('universe:left', data => {
  const { universe_id, user_id } = data;
});
```

### Universe Updates

```javascript
// Client -> Server
socket.emit('universe:update', {
  universe_id: 'xxx',
  changes: {
    name: 'New Name',
    description: 'New Description',
  },
});

// Server -> Client
socket.on('universe:updated', data => {
  const { universe_id, changes } = data;
});
```

## Parameter Events

### Parameter Update

```javascript
// Client -> Server
socket.emit('parameter:update', {
  universe_id: 'xxx',
  category: 'physics',
  parameters: {
    gravity: 15.0,
    particle_speed: 50.0,
  },
});

// Server -> Client
socket.on('parameter:updated', data => {
  const { universe_id, category, parameters } = data;
});
```

### Parameter Reset

```javascript
// Client -> Server
socket.emit('parameter:reset', {
  universe_id: 'xxx',
  category: 'physics',
});

// Server -> Client
socket.on('parameter:reset', data => {
  const { universe_id, category, default_parameters } = data;
});
```

### Parameter Sync

```javascript
// Client -> Server
socket.emit('parameter:sync', {
  universe_id: 'xxx',
});

// Server -> Client
socket.on('parameter:synced', data => {
  const {
    physics_parameters,
    music_parameters,
    audio_parameters,
    visualization_parameters,
  } = data;
});
```

## Collaboration Events

### Cursor Position

```javascript
// Client -> Server
socket.emit('collaboration:cursor', {
  universe_id: 'xxx',
  user_id: 'yyy',
  position: { x: 100, y: 200 },
});

// Server -> Client
socket.on('collaboration:cursor', data => {
  const { universe_id, user_id, position } = data;
});
```

### User Presence

```javascript
// Client -> Server
socket.emit('collaboration:presence', {
  universe_id: 'xxx',
  user_id: 'yyy',
  status: 'active',
});

// Server -> Client
socket.on('collaboration:presence', data => {
  const { universe_id, user_id, status } = data;
});
```

### Chat Messages

```javascript
// Client -> Server
socket.emit('collaboration:message', {
  universe_id: 'xxx',
  user_id: 'yyy',
  message: 'Hello!',
});

// Server -> Client
socket.on('collaboration:message', data => {
  const { universe_id, user_id, message } = data;
});
```

## System Events

### Error Events

```javascript
socket.on('system:error', data => {
  const { code, message, details } = data;
});
```

### Notification Events

```javascript
socket.on('system:notification', data => {
  const { type, message, data } = data;
});
```

### Maintenance Events

```javascript
socket.on('system:maintenance', data => {
  const { type, message, estimated_duration } = data;
});
```

## State Management

### Initial State

```javascript
socket.on('state:initial', data => {
  const { universe, parameters, participants, history } = data;
});
```

### State Sync

```javascript
socket.emit('state:sync', {
  universe_id: 'xxx',
  last_sync: timestamp,
});

socket.on('state:synced', data => {
  const { universe_id, state, timestamp } = data;
});
```

## Performance Optimization

### Message Batching

```javascript
// Batch multiple parameter updates
socket.emit('parameter:batch_update', {
  universe_id: 'xxx',
  updates: [
    {
      category: 'physics',
      parameters: { gravity: 15.0 },
    },
    {
      category: 'music',
      parameters: { tempo: 120 },
    },
  ],
});
```

### Delta Updates

```javascript
socket.emit('parameter:delta', {
  universe_id: 'xxx',
  category: 'physics',
  changes: {
    gravity: { from: 10.0, to: 15.0 },
  },
});
```

## Error Handling

### Reconnection

```javascript
socket.io.on('reconnect_attempt', attempt => {
  console.log(`Reconnection attempt ${attempt}`);
});

socket.io.on('reconnect_failed', () => {
  console.log('Failed to reconnect');
});
```

### Error Codes

```javascript
const ERROR_CODES = {
  UNAUTHORIZED: 'unauthorized',
  INVALID_UNIVERSE: 'invalid_universe',
  INVALID_PARAMETERS: 'invalid_parameters',
  RATE_LIMITED: 'rate_limited',
  SERVER_ERROR: 'server_error',
};
```

## Security

### Authentication

```javascript
socket.on('connect', () => {
  socket.emit('authenticate', { token: 'JWT_TOKEN' });
});

socket.on('authenticated', () => {
  console.log('Successfully authenticated');
});
```

### Rate Limiting

```javascript
socket.on('rate_limit', data => {
  const { limit, remaining, reset_at } = data;
});
```

## Development Tools

### Debug Mode

```javascript
const socket = io('wss://api.harmonic-universe.com', {
  debug: true,
  debugLevel: 3,
});
```

### Event Logging

```javascript
socket.onAny((event, ...args) => {
  console.log(`[WebSocket] ${event}:`, args);
});
```
