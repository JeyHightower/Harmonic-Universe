# Harmonic Universe API Documentation

## Overview

The Harmonic Universe API provides endpoints for managing music generation, physics simulation, and audio-visual synchronization. This document outlines all available endpoints, their parameters, and expected responses.

## Base URL

```
https://api.harmonicuniverse.com/v1
```

## Authentication

All requests must include an `Authorization` header with a valid JWT token:

```
Authorization: Bearer <your_token>
```

## Rate Limits

- 100 requests per minute per IP
- 1000 requests per hour per user
- WebSocket connections limited to 5 per user

## Endpoints

### Authentication

#### POST /auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "username": "string"
  }
}
```

### Music Generation

#### POST /music/generate

Generate a new musical sequence.

**Request Body:**

```json
{
  "key": "string",          // Musical key (C, C#, D, etc.)
  "scale": "string",        // Scale type (Major, Minor, etc.)
  "tempo": number,          // BPM (30-300)
  "harmony": number,        // Harmony complexity (0-1)
  "rhythm": number,         // Rhythm complexity (0-1)
  "dynamics": number,       // Dynamic range (0-1)
  "duration": number        // Sequence duration in seconds
}
```

**Response:**

```json
{
  "id": "string",
  "sequence": {
    "notes": [
      {
        "pitch": number,
        "startTime": number,
        "duration": number,
        "velocity": number
      }
    ],
    "tempo": number,
    "timeSignature": [number, number]
  }
}
```

### Physics Simulation

#### POST /physics/parameters

Update physics simulation parameters.

**Request Body:**

```json
{
  "gravity": number,        // Gravity strength (0-20)
  "friction": number,       // Surface friction (0-1)
  "elasticity": number,     // Collision elasticity (0-1)
  "airResistance": number, // Air resistance (0-1)
  "density": number,       // Particle density (0-5)
  "timeScale": number      // Simulation speed (0.1-2)
}
```

### Audio Analysis

#### POST /audio/analyze

Analyze audio for physics synchronization.

**Request Body:**

```json
{
  "audioData": "base64string", // Raw audio data
  "sampleRate": number,        // Audio sample rate
  "fftSize": number           // FFT window size (power of 2)
}
```

**Response:**

```json
{
  "frequencies": {
    "bass": number,      // Bass frequency magnitude (0-1)
    "mid": number,       // Mid frequency magnitude (0-1)
    "high": number       // High frequency magnitude (0-1)
  },
  "beats": {
    "tempo": number,     // Detected tempo
    "positions": number[] // Beat positions in seconds
  }
}
```

### MIDI Operations

#### POST /midi/import

Import MIDI file.

**Request:**

- Content-Type: multipart/form-data
- File field name: "midiFile"
- Max file size: 10MB

**Response:**

```json
{
  "id": "string",
  "tracks": [
    {
      "id": "string",
      "name": "string",
      "notes": [
        {
          "pitch": number,
          "startTime": number,
          "duration": number,
          "velocity": number
        }
      ],
      "instrument": "string"
    }
  ]
}
```

#### GET /midi/export/{sequenceId}

Export sequence as MIDI file.

**Response:**

- Content-Type: audio/midi
- File download

### WebSocket Events

Connect to WebSocket endpoint:

```
wss://api.harmonicuniverse.com/v1/ws
```

#### Audio Analysis Stream

```json
{
  "type": "audioAnalysis",
  "data": {
    "frequencies": {
      "bass": number,
      "mid": number,
      "high": number
    },
    "time": number
  }
}
```

#### Physics Update Stream

```json
{
  "type": "physicsUpdate",
  "data": {
    "particles": [
      {
        "id": "string",
        "position": [number, number],
        "velocity": [number, number],
        "mass": number
      }
    ],
    "time": number
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "string",
  "details": "string"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "resetTime": "string" // ISO timestamp
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Limits and Constraints

### Audio Processing

- Maximum audio file size: 50MB
- Supported formats: WAV, MP3, OGG
- Maximum duration: 10 minutes
- Sample rates: 44.1kHz, 48kHz
- Bit depth: 16-bit, 24-bit

### MIDI Files

- Maximum file size: 10MB
- Maximum tracks per file: 32
- Maximum notes per track: 10,000
- Supported formats: SMF (Standard MIDI File) type 0, 1

### Physics Simulation

- Maximum particles: 1,000
- Update frequency: 60Hz
- Maximum simulation time: 1 hour
- Collision detection limit: 10,000 checks per frame

### WebSocket Connections

- Maximum connections per user: 5
- Message size limit: 100KB
- Heartbeat interval: 30 seconds
- Reconnection attempts: 5 with exponential backoff
