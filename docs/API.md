# API Documentation

## Authentication

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### Refresh Token

```http
POST /api/auth/refresh
Authorization: Bearer {refresh_token}
```

### Reset Password Request

```http
POST /api/auth/reset-password-request
Content-Type: application/json

{
  "email": "string"
}
```

### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "string",
  "new_password": "string"
}
```

## Universe Management

### Create Universe

```http
POST /api/universes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "physics_params": {
    "gravity": "number",
    "friction": "number",
    "elasticity": "number",
    "air_resistance": "number",
    "density": "number",
    "time_scale": "number"
  },
  "audio_params": {
    "harmony": "number",
    "tempo": "number",
    "key": "string",
    "scale": "string",
    "rhythm_complexity": "number",
    "melody_range": "number"
  }
}
```

### Get Universe

```http
GET /api/universes/{universe_id}
Authorization: Bearer {token}
```

### Update Universe

```http
PUT /api/universes/{universe_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "physics_params": {
    "gravity": "number",
    "friction": "number",
    "elasticity": "number",
    "air_resistance": "number",
    "density": "number",
    "time_scale": "number"
  },
  "audio_params": {
    "harmony": "number",
    "tempo": "number",
    "key": "string",
    "scale": "string",
    "rhythm_complexity": "number",
    "melody_range": "number"
  }
}
```

### Delete Universe

```http
DELETE /api/universes/{universe_id}
Authorization: Bearer {token}
```

### List Universes

```http
GET /api/universes
Authorization: Bearer {token}
Query Parameters:
  - page: integer
  - per_page: integer
  - sort_by: string
  - order: asc|desc
```

### Share Universe

```http
POST /api/universes/{universe_id}/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "string",
  "permission": "view|edit"
}
```

## Physics Engine

### Update Physics Parameters

```http
PUT /api/universes/{universe_id}/physics
Authorization: Bearer {token}
Content-Type: application/json

{
  "gravity": "number",
  "friction": "number",
  "elasticity": "number",
  "air_resistance": "number",
  "density": "number",
  "time_scale": "number"
}
```

### Get Physics State

```http
GET /api/universes/{universe_id}/physics
Authorization: Bearer {token}
```

### Reset Physics

```http
POST /api/universes/{universe_id}/physics/reset
Authorization: Bearer {token}
```

## Audio System

### Update Audio Parameters

```http
PUT /api/universes/{universe_id}/audio
Authorization: Bearer {token}
Content-Type: application/json

{
  "harmony": "number",
  "tempo": "number",
  "key": "string",
  "scale": "string",
  "rhythm_complexity": "number",
  "melody_range": "number"
}
```

### Get Audio State

```http
GET /api/universes/{universe_id}/audio
Authorization: Bearer {token}
```

### Export Audio

```http
POST /api/universes/{universe_id}/audio/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "wav",
  "duration": "number"
}
```

## WebSocket API

### Connect

```javascript
const ws = new WebSocket('ws://api.example.com/ws');
```

### Authentication

```json
{
  "type": "auth",
  "token": "string"
}
```

### Join Universe

```json
{
  "type": "join",
  "universe_id": "string"
}
```

### Update Parameters

```json
{
  "type": "update",
  "universe_id": "string",
  "params": {
    "physics": {
      "gravity": "number",
      "friction": "number"
    },
    "audio": {
      "harmony": "number",
      "tempo": "number"
    }
  }
}
```

### Chat Message

```json
{
  "type": "chat",
  "universe_id": "string",
  "message": "string"
}
```

### User Presence

```json
{
  "type": "presence",
  "status": "online|away|offline"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "string",
  "message": "string",
  "details": {}
}
```

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "error": "forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests",
  "retry_after": "number"
}
```

## Rate Limits

- Authentication endpoints: 5 requests per minute
- Universe management: 60 requests per minute
- Physics updates: 120 requests per minute
- WebSocket messages: 100 messages per minute

## Data Types

### Universe

```typescript
interface Universe {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  physics_params: PhysicsParams;
  audio_params: AudioParams;
  shared_with: SharedUser[];
}
```

### Physics Parameters

```typescript
interface PhysicsParams {
  gravity: number; // 0-20 m/s²
  friction: number; // 0-1
  elasticity: number; // 0-1
  air_resistance: number; // 0-1
  density: number; // 0-5 kg/m³
  time_scale: number; // 0.1-2
}
```

### Audio Parameters

```typescript
interface AudioParams {
  harmony: number; // 0-1
  tempo: number; // 40-200 BPM
  key: string; // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
  scale: string; // major, minor, harmonic_minor, melodic_minor, pentatonic, blues
  rhythm_complexity: number; // 0-1
  melody_range: number; // 0-1
}
```

### Shared User

```typescript
interface SharedUser {
  user_id: string;
  permission: 'view' | 'edit';
  shared_at: string;
}
```
