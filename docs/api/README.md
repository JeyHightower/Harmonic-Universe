# Harmonic Universe API Documentation

This document provides detailed information about the Harmonic Universe API endpoints, request formats, response structures, and authentication requirements.

## Base URL

For development: `http://localhost:5001/api`
For production: `https://your-domain.com/api`

## Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT).

### Authentication Headers

Include the JWT token in the Authorization header for authenticated requests:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Register a new user

```
POST /auth/register
```

Request body:

```json
{
  "username": "example_user",
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "example_user",
    "email": "user@example.com",
    "created_at": "2023-03-15T12:00:00"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```
POST /auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "example_user",
    "email": "user@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Demo Login

```
POST /auth/demo-login
```

Response:

```json
{
  "message": "Demo login successful",
  "user": {
    "id": 999,
    "username": "demo_user",
    "email": "demo@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Validate Token

```
GET /auth/validate
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Token is valid",
  "user": {
    "id": 1,
    "username": "example_user",
    "email": "user@example.com"
  }
}
```

## User Endpoints

### Get User Profile

```
GET /user/profile
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "id": 1,
  "username": "example_user",
  "email": "user@example.com",
  "created_at": "2023-03-15T12:00:00",
  "updated_at": "2023-03-16T10:30:00",
  "version": 1,
  "stats": {
    "universes_count": 3,
    "scenes_count": 15,
    "characters_count": 10,
    "notes_count": 25
  }
}
```

## Universe Endpoints

### Get All Universes

```
GET /universes/
```

Query Parameters:

- `public` (boolean): Set to "true" to only show public universes
- `user_only` (boolean): Set to "true" to only show the current user's universes

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Universes retrieved successfully",
  "universes": [
    {
      "id": 1,
      "name": "Fantasy World",
      "description": "A high fantasy universe",
      "user_id": 1,
      "is_public": true,
      "created_at": "2023-03-15T14:00:00",
      "updated_at": "2023-03-16T09:30:00"
    },
    {
      "id": 2,
      "name": "Sci-Fi Adventure",
      "description": "A futuristic science fiction setting",
      "user_id": 1,
      "is_public": false,
      "created_at": "2023-03-17T11:20:00",
      "updated_at": "2023-03-17T16:45:00"
    }
  ]
}
```

### Get Universe by ID

```
GET /universes/{universe_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Universe retrieved successfully",
  "universe": {
    "id": 1,
    "name": "Fantasy World",
    "description": "A high fantasy universe",
    "user_id": 1,
    "is_public": true,
    "created_at": "2023-03-15T14:00:00",
    "updated_at": "2023-03-16T09:30:00",
    "scenes_count": 8,
    "characters_count": 12,
    "notes_count": 15
  }
}
```

### Create Universe

```
POST /universes/
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "name": "New Universe",
  "description": "Description of the new universe",
  "is_public": false
}
```

Response:

```json
{
  "message": "Universe created successfully",
  "universe": {
    "id": 3,
    "name": "New Universe",
    "description": "Description of the new universe",
    "user_id": 1,
    "is_public": false,
    "created_at": "2023-03-18T10:00:00",
    "updated_at": "2023-03-18T10:00:00"
  }
}
```

### Update Universe

```
PUT /universes/{universe_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "name": "Updated Universe Name",
  "description": "Updated description",
  "is_public": true
}
```

Response:

```json
{
  "message": "Universe updated successfully",
  "universe": {
    "id": 1,
    "name": "Updated Universe Name",
    "description": "Updated description",
    "user_id": 1,
    "is_public": true,
    "created_at": "2023-03-15T14:00:00",
    "updated_at": "2023-03-18T11:30:00"
  }
}
```

### Delete Universe

```
DELETE /universes/{universe_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Universe deleted successfully"
}
```

## Scene Endpoints

### Get All Scenes

```
GET /scenes/
```

Query Parameters:

- `universe_id` (integer): Filter scenes by universe ID

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Scenes retrieved successfully",
  "scenes": [
    {
      "id": 1,
      "name": "Castle Entrance",
      "description": "The grand entrance to the castle",
      "universe_id": 1,
      "status": "active",
      "created_at": "2023-03-15T16:00:00",
      "updated_at": "2023-03-16T09:35:00"
    },
    {
      "id": 2,
      "name": "Throne Room",
      "description": "The king's throne room",
      "universe_id": 1,
      "status": "active",
      "created_at": "2023-03-15T16:10:00",
      "updated_at": "2023-03-16T09:40:00"
    }
  ]
}
```

### Get Scenes by Universe ID

```
GET /scenes/universe/{universe_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Scenes retrieved successfully",
  "scenes": [
    {
      "id": 1,
      "name": "Castle Entrance",
      "description": "The grand entrance to the castle",
      "universe_id": 1,
      "status": "active",
      "created_at": "2023-03-15T16:00:00",
      "updated_at": "2023-03-16T09:35:00"
    },
    {
      "id": 2,
      "name": "Throne Room",
      "description": "The king's throne room",
      "universe_id": 1,
      "status": "active",
      "created_at": "2023-03-15T16:10:00",
      "updated_at": "2023-03-16T09:40:00"
    }
  ]
}
```

### Get Scene by ID

```
GET /scenes/{scene_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Scene retrieved successfully",
  "scene": {
    "id": 1,
    "name": "Castle Entrance",
    "description": "The grand entrance to the castle",
    "universe_id": 1,
    "status": "active",
    "time_of_day": "morning",
    "significance": "high",
    "created_at": "2023-03-15T16:00:00",
    "updated_at": "2023-03-16T09:35:00",
    "characters": [
      {
        "id": 1,
        "name": "King Arthur",
        "role": "protagonist"
      },
      {
        "id": 3,
        "name": "Guard Captain",
        "role": "supporting"
      }
    ]
  }
}
```

### Create Scene

```
POST /scenes/
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "name": "New Scene",
  "description": "Description of the new scene",
  "universe_id": 1,
  "status": "draft",
  "time_of_day": "evening",
  "significance": "medium"
}
```

Response:

```json
{
  "message": "Scene created successfully",
  "scene": {
    "id": 3,
    "name": "New Scene",
    "description": "Description of the new scene",
    "universe_id": 1,
    "status": "draft",
    "time_of_day": "evening",
    "significance": "medium",
    "created_at": "2023-03-18T12:00:00",
    "updated_at": "2023-03-18T12:00:00"
  }
}
```

### Update Scene

```
PUT /scenes/{scene_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "name": "Updated Scene Name",
  "description": "Updated description",
  "status": "active",
  "time_of_day": "night",
  "significance": "high"
}
```

Response:

```json
{
  "message": "Scene updated successfully",
  "scene": {
    "id": 1,
    "name": "Updated Scene Name",
    "description": "Updated description",
    "universe_id": 1,
    "status": "active",
    "time_of_day": "night",
    "significance": "high",
    "created_at": "2023-03-15T16:00:00",
    "updated_at": "2023-03-18T13:30:00"
  }
}
```

### Delete Scene

```
DELETE /scenes/{scene_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Scene deleted successfully"
}
```

## Character Endpoints

### Get Characters by Universe ID

```
GET /characters/universe/{universe_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Characters retrieved successfully",
  "characters": [
    {
      "id": 1,
      "name": "King Arthur",
      "description": "The noble king of Camelot",
      "universe_id": 1,
      "role": "protagonist",
      "created_at": "2023-03-15T17:00:00",
      "updated_at": "2023-03-16T10:15:00"
    },
    {
      "id": 2,
      "name": "Merlin",
      "description": "A powerful wizard",
      "universe_id": 1,
      "role": "supporting",
      "created_at": "2023-03-15T17:10:00",
      "updated_at": "2023-03-16T10:20:00"
    }
  ]
}
```

### Get Character by ID

```
GET /characters/{character_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Character retrieved successfully",
  "character": {
    "id": 1,
    "name": "King Arthur",
    "description": "The noble king of Camelot",
    "universe_id": 1,
    "role": "protagonist",
    "age": 35,
    "background": "Born to nobility and raised to be king",
    "created_at": "2023-03-15T17:00:00",
    "updated_at": "2023-03-16T10:15:00",
    "scenes": [
      {
        "id": 1,
        "name": "Castle Entrance"
      },
      {
        "id": 2,
        "name": "Throne Room"
      }
    ]
  }
}
```

### Create Character

```
POST /characters/
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "name": "New Character",
  "description": "Description of the new character",
  "universe_id": 1,
  "role": "antagonist",
  "age": 45,
  "background": "Character background information"
}
```

Response:

```json
{
  "message": "Character created successfully",
  "character": {
    "id": 3,
    "name": "New Character",
    "description": "Description of the new character",
    "universe_id": 1,
    "role": "antagonist",
    "age": 45,
    "background": "Character background information",
    "created_at": "2023-03-18T14:00:00",
    "updated_at": "2023-03-18T14:00:00"
  }
}
```

### Update Character

```
PUT /characters/{character_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "name": "Updated Character Name",
  "description": "Updated description",
  "role": "protagonist",
  "age": 40,
  "background": "Updated background information"
}
```

Response:

```json
{
  "message": "Character updated successfully",
  "character": {
    "id": 1,
    "name": "Updated Character Name",
    "description": "Updated description",
    "universe_id": 1,
    "role": "protagonist",
    "age": 40,
    "background": "Updated background information",
    "created_at": "2023-03-15T17:00:00",
    "updated_at": "2023-03-18T15:30:00"
  }
}
```

### Delete Character

```
DELETE /characters/{character_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Character deleted successfully"
}
```

## Note Endpoints

### Get Notes by Universe ID

```
GET /notes/universe/{universe_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Notes retrieved successfully",
  "notes": [
    {
      "id": 1,
      "title": "Castle History",
      "content": "The castle was built 200 years ago...",
      "universe_id": 1,
      "created_at": "2023-03-15T18:00:00",
      "updated_at": "2023-03-16T11:15:00"
    },
    {
      "id": 2,
      "title": "Magic System",
      "content": "Magic in this universe works by...",
      "universe_id": 1,
      "created_at": "2023-03-15T18:10:00",
      "updated_at": "2023-03-16T11:20:00"
    }
  ]
}
```

### Get Note by ID

```
GET /notes/{note_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Note retrieved successfully",
  "note": {
    "id": 1,
    "title": "Castle History",
    "content": "The castle was built 200 years ago...",
    "universe_id": 1,
    "scene_id": 1,
    "character_id": null,
    "created_at": "2023-03-15T18:00:00",
    "updated_at": "2023-03-16T11:15:00"
  }
}
```

### Create Note

```
POST /notes/
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "title": "New Note",
  "content": "Content of the new note",
  "universe_id": 1,
  "scene_id": 2,
  "character_id": null
}
```

Response:

```json
{
  "message": "Note created successfully",
  "note": {
    "id": 3,
    "title": "New Note",
    "content": "Content of the new note",
    "universe_id": 1,
    "scene_id": 2,
    "character_id": null,
    "created_at": "2023-03-18T16:00:00",
    "updated_at": "2023-03-18T16:00:00"
  }
}
```

### Update Note

```
PUT /notes/{note_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Request body:

```json
{
  "title": "Updated Note Title",
  "content": "Updated note content",
  "scene_id": 1,
  "character_id": 2
}
```

Response:

```json
{
  "message": "Note updated successfully",
  "note": {
    "id": 1,
    "title": "Updated Note Title",
    "content": "Updated note content",
    "universe_id": 1,
    "scene_id": 1,
    "character_id": 2,
    "created_at": "2023-03-15T18:00:00",
    "updated_at": "2023-03-18T17:30:00"
  }
}
```

### Delete Note

```
DELETE /notes/{note_id}
```

Headers:

```
Authorization: Bearer <your_jwt_token>
```

Response:

```json
{
  "message": "Note deleted successfully"
}
```

## Error Responses

The API returns standardized error responses:

### 400 Bad Request

```json
{
  "message": "Invalid request",
  "error": "Details about the validation error"
}
```

### 401 Unauthorized

```json
{
  "message": "Missing or invalid authentication token"
}
```

### 403 Forbidden

```json
{
  "message": "Access denied"
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Error processing request",
  "error": "Error details"
}
```

## Rate Limiting

The API implements rate limiting to protect against abuse. When rate limit is exceeded, the API will return:

```json
{
  "message": "Rate limit exceeded",
  "retry_after": 60
}
```

## Pagination

For endpoints that return lists of items, pagination is supported using the following query parameters:

- `page`: Page number (default: 1)
- `per_page`: Number of items per page (default: 20, max: 100)

Example:

```
GET /universes/?page=2&per_page=10
```

Response includes pagination metadata:

```json
{
  "message": "Universes retrieved successfully",
  "universes": [...],
  "pagination": {
    "page": 2,
    "per_page": 10,
    "total_items": 35,
    "total_pages": 4
  }
}
```

## Websocket API

For real-time features, see the [WebSocket Protocol Documentation](../frontend/api/WEBSOCKET_PROTOCOL.md).
