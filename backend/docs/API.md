# Harmonic Universe API Documentation

This document provides comprehensive documentation for the Harmonic Universe API endpoints.

## API Structure

The API follows a RESTful structure with the following main resources:

- Users: Authentication and user management
- Universes: Story universes containing scenes, characters, etc.
- Scenes: Individual scenes within a universe
- Characters: Characters that appear in scenes
- Notes: Notes associated with universes, scenes, or characters
- Physics: Physics simulation rules and parameters

## Authentication Endpoints

### Register a new user

**POST** `/api/auth/register`

Request:
```json
{
  "username": "username",
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "id": 1,
  "username": "username",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

**POST** `/api/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "id": 1,
  "username": "username",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

**POST** `/api/auth/logout`

Response:
```json
{
  "message": "Successfully logged out"
}
```

## Universe Endpoints

### Get all universes

**GET** `/api/universes`

Query Parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10)
- `search`: Search term

Response:
```json
{
  "count": 2,
  "universes": [
    {
      "id": 1,
      "name": "Physics World",
      "description": "A universe with custom physics rules",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-02T12:00:00Z",
      "user_id": 1
    },
    {
      "id": 2,
      "name": "Music Universe",
      "description": "A universe with music-based interactions",
      "created_at": "2023-01-03T12:00:00Z",
      "updated_at": "2023-01-04T12:00:00Z",
      "user_id": 1
    }
  ],
  "total_pages": 1
}
```

### Create a universe

**POST** `/api/universes`

Request:
```json
{
  "name": "New Universe",
  "description": "Description of the universe",
  "physics_parameters": {
    "gravity": 9.8,
    "friction": 0.1
  }
}
```

Response:
```json
{
  "id": 3,
  "name": "New Universe",
  "description": "Description of the universe",
  "created_at": "2023-01-05T12:00:00Z",
  "updated_at": "2023-01-05T12:00:00Z",
  "user_id": 1,
  "physics_parameters": {
    "gravity": 9.8,
    "friction": 0.1
  }
}
```

### Get a specific universe

**GET** `/api/universes/:id`

Response:
```json
{
  "id": 1,
  "name": "Physics World",
  "description": "A universe with custom physics rules",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-02T12:00:00Z",
  "user_id": 1,
  "physics_parameters": {
    "gravity": 9.8,
    "friction": 0.1
  },
  "scenes_count": 3
}
```

### Update a universe

**PUT** `/api/universes/:id`

Request:
```json
{
  "name": "Updated Universe Name",
  "description": "Updated description",
  "physics_parameters": {
    "gravity": 10.0,
    "friction": 0.2
  }
}
```

Response:
```json
{
  "id": 1,
  "name": "Updated Universe Name",
  "description": "Updated description",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-06T12:00:00Z",
  "user_id": 1,
  "physics_parameters": {
    "gravity": 10.0,
    "friction": 0.2
  }
}
```

### Delete a universe

**DELETE** `/api/universes/:id`

Response:
```json
{
  "message": "Universe deleted successfully"
}
```

## Scene Endpoints

### Get all scenes

**GET** `/api/scenes`

Query Parameters:
- `universe_id`: Filter by universe (optional)
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10)

Response:
```json
{
  "count": 2,
  "scenes": [
    {
      "id": 1,
      "name": "Gravity Simulation",
      "description": "A scene demonstrating gravity",
      "universe_id": 1,
      "created_at": "2023-01-01T14:00:00Z",
      "updated_at": "2023-01-02T14:00:00Z"
    },
    {
      "id": 2,
      "name": "Pendulum",
      "description": "A pendulum simulation",
      "universe_id": 1,
      "created_at": "2023-01-03T14:00:00Z",
      "updated_at": "2023-01-04T14:00:00Z"
    }
  ],
  "total_pages": 1
}
```

### Get scenes for a universe

**GET** `/api/scenes/universe/:universe_id`

Response:
```json
{
  "universe_id": 1,
  "universe_name": "Physics World",
  "scenes": [
    {
      "id": 1,
      "name": "Gravity Simulation",
      "description": "A scene demonstrating gravity",
      "created_at": "2023-01-01T14:00:00Z",
      "updated_at": "2023-01-02T14:00:00Z"
    },
    {
      "id": 2,
      "name": "Pendulum",
      "description": "A pendulum simulation",
      "created_at": "2023-01-03T14:00:00Z",
      "updated_at": "2023-01-04T14:00:00Z"
    }
  ]
}
```

### Create a scene

**POST** `/api/scenes`

Request:
```json
{
  "name": "New Scene",
  "description": "A new scene",
  "universe_id": 1,
  "elements": [
    {
      "type": "circle",
      "x": 100,
      "y": 100,
      "radius": 20,
      "mass": 5
    }
  ]
}
```

Response:
```json
{
  "id": 3,
  "name": "New Scene",
  "description": "A new scene",
  "universe_id": 1,
  "created_at": "2023-01-05T14:00:00Z",
  "updated_at": "2023-01-05T14:00:00Z",
  "elements": [
    {
      "id": 1,
      "type": "circle",
      "x": 100,
      "y": 100,
      "radius": 20,
      "mass": 5
    }
  ]
}
```

### Get a specific scene

**GET** `/api/scenes/:id`

Response:
```json
{
  "id": 1,
  "name": "Gravity Simulation",
  "description": "A scene demonstrating gravity",
  "universe_id": 1,
  "created_at": "2023-01-01T14:00:00Z",
  "updated_at": "2023-01-02T14:00:00Z",
  "elements": [
    {
      "id": 1,
      "type": "circle",
      "x": 100,
      "y": 100,
      "radius": 20,
      "mass": 5
    }
  ],
  "universe": {
    "id": 1,
    "name": "Physics World"
  }
}
```

### Update a scene

**PUT** `/api/scenes/:id`

Request:
```json
{
  "name": "Updated Scene Name",
  "description": "Updated description",
  "elements": [
    {
      "id": 1,
      "type": "circle",
      "x": 150,
      "y": 150,
      "radius": 25,
      "mass": 10
    }
  ]
}
```

Response:
```json
{
  "id": 1,
  "name": "Updated Scene Name",
  "description": "Updated description",
  "universe_id": 1,
  "created_at": "2023-01-01T14:00:00Z",
  "updated_at": "2023-01-06T14:00:00Z",
  "elements": [
    {
      "id": 1,
      "type": "circle",
      "x": 150,
      "y": 150,
      "radius": 25,
      "mass": 10
    }
  ]
}
```

### Delete a scene

**DELETE** `/api/scenes/:id`

Response:
```json
{
  "message": "Scene deleted successfully"
}
```

## Character Endpoints

### Get all characters

**GET** `/api/characters`

### Create a character

**POST** `/api/characters`

### Get a specific character

**GET** `/api/characters/:id`

### Update a character

**PUT** `/api/characters/:id`

### Delete a character

**DELETE** `/api/characters/:id`

## Note Endpoints

### Get all notes

**GET** `/api/notes`

### Create a note

**POST** `/api/notes`

### Get a specific note

**GET** `/api/notes/:id`

### Update a note

**PUT** `/api/notes/:id`

### Delete a note

**DELETE** `/api/notes/:id`

## Best Practices

### Endpoint Consistency

We have consolidated duplicate endpoints to maintain a single source of truth. For example, to get scenes for a universe:

✅ **Use:** `/api/scenes/universe/:universe_id`  
❌ **Avoid:** `/api/universes/:universe_id/scenes` (redirects to primary endpoint)

When developing new features, always check the endpoint documentation to use the primary endpoints.

### Error Handling

All API errors follow a consistent format:

```json
{
  "error": "Error message",
  "status_code": 400,
  "details": {
    "field": ["Error details"]
  }
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error

### Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Pagination

Paginated endpoints follow a consistent format:

```json
{
  "count": 20,
  "items": [...],
  "total_pages": 2,
  "current_page": 1,
  "next_page": 2,
  "prev_page": null
}
```

### Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

- Authenticated requests: 100 requests per minute
- Unauthenticated requests: 20 requests per minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Seconds until rate limit window resets 