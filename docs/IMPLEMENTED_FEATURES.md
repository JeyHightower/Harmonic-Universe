# Harmonic Universe - Implemented Features

## Table of Contents
- [[#Core Features]]
- [[#Authentication & Security]]
- [[#Data Models]]
- [[#API Endpoints]]
- [[#Physics System]]
- [[#Music System]]
- [[#Frontend Components]]

## Core Features

### User Management
- User registration with username, email, and password
- User login with session management
- Rate limiting on authentication routes (5 requests/minute, 100/day)
- Secure password hashing using Flask-Bcrypt
- JWT-based authentication

### Universe Management
- Create and manage multiple universes
- Universe properties:
  - Name and description
  - 2D/3D physics settings
  - Sound profile configuration
  - Visibility settings (public/private)
  - Version control

### Scene Management
- Create scenes within universes
- Scene properties:
  - Title and description
  - Associated music pieces
  - 2D/3D physics settings
  - Character assignments
  - Order management

## Authentication & Security

### Implemented Security Features
- CORS configuration with specific origins
- Rate limiting on sensitive routes
- Secure session management
- Password hashing
- JWT token authentication
- HTTPS enforcement
- Security headers via Flask-Talisman

### Rate Limiting
- Auth routes: 5 requests/minute
- Global rate limit: 200 requests/day
- Per-route rate limits
- Redis-based storage for rate limiting

## Data Models

### User Model
```python
class User:
    - id: Integer (PK)
    - username: String (unique)
    - email: String (unique)
    - password_hash: String
    - created_at: DateTime
    - updated_at: DateTime
```

### Universe Model
```python
class Universe:
    - id: Integer (PK)
    - name: String
    - description: Text
    - creator_id: Integer (FK)
    - sound_profile_id: Integer (FK)
    - is_2d: Boolean
    - created_at: DateTime
    - updated_at: DateTime
```

### Scene Model
```python
class Scene:
    - id: Integer (PK)
    - title: String
    - description: Text
    - universe_id: Integer (FK)
    - music_piece_id: Integer (FK)
    - is_2d: Boolean
    - created_at: DateTime
    - updated_at: DateTime
```

### Character Model
```python
class Character:
    - id: Integer (PK)
    - name: String
    - description: Text
    - universe_id: Integer (FK)
    - has_physics: Boolean
    - created_at: DateTime
    - updated_at: DateTime
```

### Note Model
```python
class Note:
    - id: Integer (PK)
    - content: Text
    - character_id: Integer (FK)
    - universe_id: Integer (FK)
    - scene_id: Integer (FK)
    - user_id: Integer (FK)
    - created_at: DateTime
    - updated_at: DateTime
```

## API Endpoints

### Authentication Routes
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user info

### Character Routes
- GET `/api/characters` - List all characters
- GET `/api/characters/<id>` - Get specific character
- POST `/api/characters` - Create new character
- PUT `/api/characters/<id>` - Update character
- DELETE `/api/characters/<id>` - Delete character

### Note Routes
- GET `/api/notes` - List all notes
- GET `/api/notes/<id>` - Get specific note
- POST `/api/notes` - Create new note
- PUT `/api/notes/<id>` - Update note
- DELETE `/api/notes/<id>` - Delete note

### Physics Routes
- GET `/api/physics/2d` - List 2D physics settings
- GET `/api/physics/2d/<id>` - Get specific 2D physics
- POST `/api/physics/2d` - Create 2D physics
- GET `/api/physics/3d` - List 3D physics settings
- GET `/api/physics/3d/<id>` - Get specific 3D physics
- POST `/api/physics/3d` - Create 3D physics
- GET `/api/physics/objects` - List physics objects
- POST `/api/physics/objects` - Create physics object
- DELETE `/api/physics/objects/<id>` - Delete physics object

## Physics System

### 2D Physics Features
- Gravity configuration (x, y)
- Friction settings
- Restitution (bounciness)
- Linear and angular damping
- Time scale adjustment

### 3D Physics Features
- 3D gravity vector
- Advanced physics parameters
- Scene-specific physics settings

### Physics Objects
- Position (x, y, z)
- Rotation (x, y, z)
- Scale (x, y, z)
- Mass and friction
- Collision properties
- Static/dynamic objects

### Physics Constraints
- Multiple constraint types
- Breaking thresholds
- Spring physics
- Axis limits
- Position and rotation constraints

## Music System

### Musical Themes
- Theme creation and management
- Key and tempo settings
- Mood/emotion mapping
- Character association
- Universe association

### Sound Profiles
- Universe-specific sound settings
- Audio file management
- MIDI sequence support
- Audio track management

## Frontend Components

### Scene Editor
- Character management
- Physics object placement
- Note creation and editing
- Music integration
- 2D/3D view switching

### Physics Editor
- Object properties
- Constraint creation
- Physics parameter adjustment
- Real-time preview

### Note System
- Rich text editing
- Character association
- Scene context
- Universe-wide notes

## Database Schema

### Core Tables
- users
- universes
- scenes
- characters
- notes
- physics_objects
- physics_constraints
- musical_themes
- sound_profiles

### Relationships
- Users -> Universes (1:N)
- Universes -> Scenes (1:N)
- Scenes -> Characters (N:M)
- Characters -> Notes (1:N)
- Scenes -> Physics Objects (1:N)
- Characters -> Physics Objects (1:N)

## Security Implementation

### Authentication
- JWT token-based auth
- Session management
- Password hashing
- Rate limiting

### Data Protection
- CORS configuration
- HTTPS enforcement
- Security headers
- Input validation

### Rate Limiting
- Redis-based storage
- Per-route limits
- Global limits
- IP-based tracking 