# Harmonic Universe API Documentation

## Authentication

### Register
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
```json
{
    "username": "string",
    "email": "string",
    "password": "string"
}
```
- **Response**: JWT token and user data

### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
```json
{
    "username": "string",
    "password": "string"
}
```
- **Response**: JWT token and user data

## Universe Management

### Create Universe
- **URL**: `/api/universes`
- **Method**: `POST`
- **Auth**: Required
- **Body**:
```json
{
    "name": "string",
    "description": "string",
    "is_public": boolean,
    "parameters": {
        "physics": object,
        "music": object,
        "visual": object
    }
}
```

### Get Universe
- **URL**: `/api/universes/{id}`
- **Method**: `GET`
- **Auth**: Required for private universes

### Update Universe
- **URL**: `/api/universes/{id}`
- **Method**: `PUT`
- **Auth**: Required
- **Permission**: Owner or Editor

### Delete Universe
- **URL**: `/api/universes/{id}`
- **Method**: `DELETE`
- **Auth**: Required
- **Permission**: Owner

## Profile Management

### Get Profile
- **URL**: `/api/profiles/{user_id}`
- **Method**: `GET`
- **Auth**: Required

### Update Profile
- **URL**: `/api/profiles/{user_id}`
- **Method**: `PUT`
- **Auth**: Required
- **Body**:
```json
{
    "bio": "string",
    "avatar_url": "string"
}
```

## Collaboration

### Add Collaborator
- **URL**: `/api/universes/{id}/collaborators`
- **Method**: `POST`
- **Auth**: Required
- **Permission**: Owner
- **Body**:
```json
{
    "user_id": "integer",
    "role": "string"
}
```

### Remove Collaborator
- **URL**: `/api/universes/{id}/collaborators/{user_id}`
- **Method**: `DELETE`
- **Auth**: Required
- **Permission**: Owner

## WebSocket Events

### Connection
- **Event**: `connect`
- **Auth**: Required
- **Response**: Connection status

### Join Universe Room
- **Event**: `join`
- **Auth**: Required
- **Data**:
```json
{
    "universe_id": "integer"
}
```

### Parameter Updates
- **Event**: `parameter_update`
- **Auth**: Required
- **Data**:
```json
{
    "universe_id": "integer",
    "parameters": object
}
```

### Cursor Movement
- **Event**: `cursor_move`
- **Auth**: Required
- **Data**:
```json
{
    "universe_id": "integer",
    "position": object
}
```

### Chat Messages
- **Event**: `chat_message`
- **Auth**: Required
- **Data**:
```json
{
    "universe_id": "integer",
    "message": "string"
}
```

## Rate Limiting

All API endpoints are rate limited to:
- 100 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

## Caching

The following endpoints are cached for 5 minutes:
- GET `/api/universes`
- GET `/api/universes/{id}`
- GET `/api/profiles/{user_id}`

## Error Responses

All error responses follow the format:
```json
{
    "error": "string",
    "message": "string",
    "status": integer
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error
