# Harmonic Universe

Welcome to the Harmonic Universe repository! This project is a collaborative physics playground designed for educational purposes.

## Overview

The Harmonic Universe is a platform that allows users to create, share, and interact with physical simulations in a 2D environment. Users can create "universes" with specific physics properties and build interactive scenes.

## Technology Stack

- **Backend**: Python/Flask
- **Frontend**: React/JavaScript
- **Database**: PostgreSQL (required for both development and production)
- **Deployment**: Render.com

## Repository Structure

- `/frontend` - React JavaScript frontend application
- `/backend` - Flask Python backend API
- `/scripts` - Utility scripts for development and deployment
- `/docs` - Documentation files

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (required - this project does not support SQLite)
- Redis (optional, for rate limiting)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/harmonic-universe.git
   cd harmonic-universe
   ```

2. Set up the backend:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the PostgreSQL database:

   ```bash
   # Create a PostgreSQL database
   createdb harmonic_universe  # If using local PostgreSQL

   # Update .env file with PostgreSQL connection string
   # DATABASE_URL=postgresql://postgres:password@localhost:5432/harmonic_universe

   # Run the setup script
   python setup_db.py
   ```

4. Start the backend server:

   ```bash
   python run.py
   ```

5. Set up the frontend:

   ```bash
   cd ../frontend
   npm install
   ```

6. Start the frontend development server:

   ```bash
   npm run dev
   ```

7. Open your browser and navigate to http://localhost:5173

## Development

Please see the README files in the `/frontend` and `/backend` directories for detailed development instructions.

## Database Configuration

This project requires PostgreSQL for both development and production environments. SQLite is not supported.

### Local Development

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/harmonic_universe
```

### Production (Render.com)

The PostgreSQL database is automatically configured in the `render.yaml` file.

## Deployment

The application can be deployed to Render.com using the provided `render.yaml` configuration file.

## API Documentation

### Authentication

All API endpoints require authentication using a Bearer token in the Authorization header, except for the registration and login endpoints.

#### Registration

```bash
POST /api/auth/signup/
Content-Type: application/json
{
    "username": "newuser123",  # Required, must start with a letter
    "email": "newuser@example.com",  # Required, must be a valid email
    "password": "Test123!@#"  # Required, must contain at least one uppercase letter
}

# Response (201 Created):
{
    "message": "Registration successful",
    "user": {
        "id": 6,
        "username": "newuser123",
        "email": "newuser@example.com",
        "created_at": "2025-06-06 01:32:45.858081",
        "updated_at": "2025-06-06 01:32:45.858084",
        "is_deleted": false,
        "version": 1
    }
}

# Error Responses:
# - 400 Bad Request: If required fields are missing or invalid
# - 409 Conflict: If username or email already exists
```

#### Login

```bash
POST /api/auth/login/
Content-Type: application/json
{
    "email": "newuser@example.com",  # Required
    "password": "Test123!@#"  # Required
}

# Response (200 OK):
{
    "message": "Login successful",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 6,
        "username": "newuser123",
        "email": "newuser@example.com",
        "created_at": "2025-06-06 01:32:45.858081",
        "updated_at": "2025-06-06 01:32:45.858084",
        "is_deleted": false,
        "version": 1
    }
}

# Error Responses:
# - 400 Bad Request: If email or password is missing
# - 401 Unauthorized: If email or password is invalid
```

#### Demo Login

```bash
POST /api/auth/demo-login/
Content-Type: application/json

# Response (200 OK):
{
    "message": "Login successful",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "demo_user",
        "email": "demo@example.com",
        "created_at": "2025-06-06 01:00:00.000000",
        "updated_at": "2025-06-06 01:00:00.000000",
        "is_deleted": false,
        "version": 1
    }
}
```

### Universes

#### List All Universes

```bash
GET /api/universes/
Authorization: Bearer <token>  # Optional

# Query Parameters:
# - public_only: boolean (default: false) - Show only public universes
# - user_only: boolean (default: false) - Show only user's universes

# Response (200 OK):
{
  "message": "Universes fetched successfully",
  "universes": [
    {
      "characters_count": 0,
      "created_at": "2025-06-06 01:09:43.578162",
      "description": "A test universe",
      "genre": null,
      "id": 6,
      "is_deleted": false,
      "is_owner": false,
      "is_public": true,
      "name": "Test Universe",
      "notes_count": 0,
      "scenes_count": 0,
      "sound_profile_id": null,
      "theme": null,
      "updated_at": "2025-06-06 01:09:43.578166",
      "user_id": 4
    }
  ]
}
```

#### Create Universe

```bash
POST /api/universes/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "name": "My Universe",  # Required, max 100 chars
    "description": "A test universe",
    "is_public": false,  # Optional, default: false
    "genre": "Fantasy",  # Optional
    "theme": "Dark"  # Optional
}

# Response (201 Created):
{
    "message": "Universe created successfully",
    "universe": {
        "id": 10,
        "name": "My Universe",
        "description": "A test universe",
        "is_public": false,
        "genre": "Fantasy",
        "theme": "Dark",
        "user_id": 6,
        "created_at": "2025-06-06 01:27:59.400224",
        "updated_at": "2025-06-06 01:27:59.400224",
        "is_deleted": false,
        "characters_count": 0,
        "scenes_count": 0,
        "notes_count": 0,
        "sound_profile_id": null
    }
}
```

#### Get Universe

```bash
GET /api/universes/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Universe retrieved successfully",
    "universe": {
        "id": 10,
        "name": "My Universe",
        "description": "A test universe",
        "is_public": false,
        "genre": "Fantasy",
        "theme": "Dark",
        "user_id": 6,
        "created_at": "2025-06-06 01:27:59.400224",
        "updated_at": "2025-06-06 01:27:59.400224",
        "is_deleted": false,
        "characters_count": 0,
        "scenes_count": 0,
        "notes_count": 0,
        "sound_profile_id": null
    }
}

# Error Responses:
# - 403 Forbidden: If universe is private and user is not the owner
# - 404 Not Found: If universe doesn't exist or is deleted
```

#### Update Universe

```bash
PUT /api/universes/{id}/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "name": "Updated Universe",  # Optional
    "description": "Updated description",  # Optional
    "is_public": true,  # Optional
    "genre": "Updated Genre",  # Optional
    "theme": "Updated Theme"  # Optional
}

# Response (200 OK):
{
    "message": "Universe updated successfully",
    "universe": {
        "id": 10,
        "name": "Updated Universe",
        "description": "Updated description",
        "is_public": true,
        "genre": "Updated Genre",
        "theme": "Updated Theme",
        "user_id": 6,
        "created_at": "2025-06-06 01:27:59.400224",
        "updated_at": "2025-06-06 01:28:18.172749",
        "is_deleted": false,
        "characters_count": 0,
        "scenes_count": 0,
        "notes_count": 0,
        "sound_profile_id": null
    }
}

# Error Responses:
# - 403 Forbidden: If user is not the owner
# - 404 Not Found: If universe doesn't exist or is deleted
```

#### Delete Universe

```bash
DELETE /api/universes/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Universe deleted successfully"
}

# Error Responses:
# - 403 Forbidden: If user is not the owner
# - 404 Not Found: If universe doesn't exist or is already deleted
```

#### Get Universe Characters

```bash
GET /api/universes/{id}/characters/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Characters retrieved successfully",
    "characters": [
        {
            "id": 3,
            "name": "Test Character",
            "description": "A test character",
            "role": "Protagonist",
            "background": "Test background",
            "universe_id": 10,
            "created_at": "2025-06-06 01:28:45.985952",
            "updated_at": "2025-06-06 01:28:45.985955",
            "is_deleted": false
        }
    ]
}

# Error Responses:
# - 403 Forbidden: If universe is private and user is not the owner
# - 404 Not Found: If universe doesn't exist or is deleted
```

#### Get Universe Scenes

```bash
GET /api/universes/{id}/scenes/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Scenes retrieved successfully",
    "scenes": [
        {
            "id": 4,
            "name": "Test Scene",
            "description": "A test scene",
            "location": "Test Location",
            "time": "Present",
            "universe_id": 10,
            "created_at": "2025-06-06 01:28:30.123456",
            "updated_at": "2025-06-06 01:28:30.123456",
            "is_deleted": false,
            "status": "draft"
        }
    ]
}

# Error Responses:
# - 403 Forbidden: If universe is private and user is not the owner
# - 404 Not Found: If universe doesn't exist or is deleted
```

#### Get Universe Notes

```bash
GET /api/universes/{id}/notes/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Notes retrieved successfully",
    "notes": [
        {
            "id": 1,
            "title": "Test Note",
            "content": "Test content",
            "universe_id": 10,
            "created_at": "2025-06-06 01:29:15.123456",
            "updated_at": "2025-06-06 01:29:15.123456",
            "is_deleted": false
        }
    ]
}

# Error Responses:
# - 403 Forbidden: If universe is private and user is not the owner
# - 404 Not Found: If universe doesn't exist or is deleted
```

### Scenes

#### List All Scenes

```bash
GET /api/scenes/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Scenes fetched successfully",
    "scenes": [
        {
            "id": 4,
            "name": "Test Scene",
            "description": "A test scene",
            "location": "Test Location",
            "time": "Present",
            "universe_id": 10,
            "created_at": "2025-06-06 01:28:30.123456",
            "updated_at": "2025-06-06 01:28:30.123456",
            "is_deleted": false,
            "status": "draft"
        }
    ]
}
```

#### Create Scene

```bash
POST /api/scenes/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "name": "My Scene",  # Required
    "description": "A test scene",
    "universe_id": 1,  # Required
    "location": "Test Location",
    "time": "Present"
}

# Response (201 Created):
{
    "message": "Scene created successfully",
    "scene": {
        "id": 4,
        "name": "My Scene",
        "description": "A test scene",
        "location": "Test Location",
        "time": "Present",
        "universe_id": 1,
        "created_at": "2025-06-06 01:28:30.123456",
        "updated_at": "2025-06-06 01:28:30.123456",
        "is_deleted": false,
        "status": "draft"
    }
}
```

#### Get Scene

```bash
GET /api/scenes/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Scene retrieved successfully",
    "scene": {
        "id": 4,
        "name": "Test Scene",
        "description": "A test scene",
        "location": "Test Location",
        "time": "Present",
        "universe_id": 10,
        "created_at": "2025-06-06 01:28:30.123456",
        "updated_at": "2025-06-06 01:28:30.123456",
        "is_deleted": false,
        "status": "draft"
    }
}

# Error Responses:
# - 403 Forbidden: If scene's universe is private and user is not the owner
# - 404 Not Found: If scene doesn't exist or is deleted
```

#### Update Scene

```bash
PUT /api/scenes/{id}/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "name": "Updated Scene",  # Optional
    "description": "Updated description",  # Optional
    "location": "Updated Location",  # Optional
    "time": "Updated Time"  # Optional
}

# Response (200 OK):
{
    "message": "Scene updated successfully",
    "scene": {
        "id": 4,
        "name": "Updated Scene",
        "description": "Updated description",
        "location": "Updated Location",
        "time": "Updated Time",
        "universe_id": 10,
        "created_at": "2025-06-06 01:28:30.123456",
        "updated_at": "2025-06-06 01:28:45.123456",
        "is_deleted": false,
        "status": "draft"
    }
}

# Error Responses:
# - 403 Forbidden: If scene's universe is private and user is not the owner
# - 404 Not Found: If scene doesn't exist or is deleted
```

#### Delete Scene

```bash
DELETE /api/scenes/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Scene deleted successfully"
}

# Error Responses:
# - 403 Forbidden: If scene's universe is private and user is not the owner
# - 404 Not Found: If scene doesn't exist or is already deleted
```

### Characters

#### List All Characters

```bash
GET /api/characters/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Characters fetched successfully",
    "characters": [
        {
            "id": 3,
            "name": "Test Character",
            "description": "A test character",
            "role": "Protagonist",
            "background": "Test background",
            "universe_id": 10,
            "created_at": "2025-06-06 01:28:45.985952",
            "updated_at": "2025-06-06 01:28:45.985955",
            "is_deleted": false
        }
    ]
}
```

#### Create Character

```bash
POST /api/characters/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "name": "My Character",  # Required
    "description": "A test character",
    "scene_id": 1,  # Required
    "role": "Protagonist",
    "background": "Character background"
}

# Response (201 Created):
{
    "message": "Character created successfully",
    "character": {
        "id": 3,
        "name": "My Character",
        "description": "A test character",
        "role": "Protagonist",
        "background": "Character background",
        "universe_id": 10,
        "created_at": "2025-06-06 01:28:45.985952",
        "updated_at": "2025-06-06 01:28:45.985955",
        "is_deleted": false
    }
}
```

#### Get Character

```bash
GET /api/characters/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Character retrieved successfully",
    "character": {
        "id": 3,
        "name": "Test Character",
        "description": "A test character",
        "role": "Protagonist",
        "background": "Test background",
        "universe_id": 10,
        "created_at": "2025-06-06 01:28:45.985952",
        "updated_at": "2025-06-06 01:28:45.985955",
        "is_deleted": false
    }
}

# Error Responses:
# - 403 Forbidden: If character's universe is private and user is not the owner
# - 404 Not Found: If character doesn't exist or is deleted
```

#### Update Character

```bash
PUT /api/characters/{id}/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "name": "Updated Character",  # Optional
    "description": "Updated description",  # Optional
    "role": "Updated Role",  # Optional
    "background": "Updated background"  # Optional
}

# Response (200 OK):
{
    "message": "Character updated successfully",
    "character": {
        "id": 3,
        "name": "Updated Character",
        "description": "Updated description",
        "role": "Updated Role",
        "background": "Updated background",
        "universe_id": 10,
        "created_at": "2025-06-06 01:28:45.985952",
        "updated_at": "2025-06-06 01:29:00.795633",
        "is_deleted": false
    }
}

# Error Responses:
# - 403 Forbidden: If character's universe is private and user is not the owner
# - 404 Not Found: If character doesn't exist or is deleted
```

#### Delete Character

```bash
DELETE /api/characters/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Character deleted successfully"
}

# Error Responses:
# - 403 Forbidden: If character's universe is private and user is not the owner
# - 404 Not Found: If character doesn't exist or is already deleted
```

### Notes

#### List All Notes

```bash
GET /api/notes/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Notes fetched successfully",
    "notes": [
        {
            "id": 1,
            "title": "Test Note",
            "content": "Test content",
            "universe_id": 10,
            "created_at": "2025-06-06 01:29:15.123456",
            "updated_at": "2025-06-06 01:29:15.123456",
            "is_deleted": false
        }
    ]
}
```

#### Create Note

```bash
POST /api/notes/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "title": "My Note",  # Required
    "content": "Note content",  # Required
    "universe_id": 1,  # Required
    "category": "General"  # Optional
}

# Response (201 Created):
{
    "message": "Note created successfully",
    "note": {
        "id": 1,
        "title": "My Note",
        "content": "Note content",
        "universe_id": 1,
        "category": "General",
        "created_at": "2025-06-06 01:29:15.123456",
        "updated_at": "2025-06-06 01:29:15.123456",
        "is_deleted": false
    }
}
```

#### Get Note

```bash
GET /api/notes/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Note retrieved successfully",
    "note": {
        "id": 1,
        "title": "Test Note",
        "content": "Test content",
        "universe_id": 10,
        "category": "General",
        "created_at": "2025-06-06 01:29:15.123456",
        "updated_at": "2025-06-06 01:29:15.123456",
        "is_deleted": false
    }
}

# Error Responses:
# - 403 Forbidden: If note's universe is private and user is not the owner
# - 404 Not Found: If note doesn't exist or is deleted
```

#### Update Note

```bash
PUT /api/notes/{id}/
Authorization: Bearer <token>  # Required
Content-Type: application/json
{
    "title": "Updated Note",  # Optional
    "content": "Updated content",  # Optional
    "category": "Updated Category"  # Optional
}

# Response (200 OK):
{
    "message": "Note updated successfully",
    "note": {
        "id": 1,
        "title": "Updated Note",
        "content": "Updated content",
        "universe_id": 10,
        "category": "Updated Category",
        "created_at": "2025-06-06 01:29:15.123456",
        "updated_at": "2025-06-06 01:29:30.123456",
        "is_deleted": false
    }
}

# Error Responses:
# - 403 Forbidden: If note's universe is private and user is not the owner
# - 404 Not Found: If note doesn't exist or is deleted
```

#### Delete Note

```bash
DELETE /api/notes/{id}/
Authorization: Bearer <token>  # Required

# Response (200 OK):
{
    "message": "Note deleted successfully"
}

# Error Responses:
# - 403 Forbidden: If note's universe is private and user is not the owner
# - 404 Not Found: If note doesn't exist or is already deleted
```

### Common Response Formats

#### Success Response

```json
{
  "message": "Operation successful",
  "data": {
    // Resource data
  }
}
```

#### Error Response

```json
{
  "error": "Error message",
  "status": "error"
}
```

### Notes

- All endpoints require authentication using a Bearer token
- All POST/PUT requests require Content-Type: application/json header
- All endpoints return JSON responses
- Resources are soft-deleted by default
- All timestamps are in ISO 8601 format
- All endpoints maintain proper relationships between resources (universe -> scenes -> characters)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

This project was created by the App Academy Capstone Team.
