# Backend Service

## Overview

The backend service is built with Flask and SQLAlchemy, providing a robust API for the Harmonic Universe application. It manages user authentication, universe creation, physics simulations, and audio generation.

## Directory Structure

```
backend/
├── app/                  # Application package
│   ├── api/              # API routes and controllers
│   │   └── routes/       # Route definitions
│   ├── core/             # Core functionality
│   │   ├── config/       # Configuration settings
│   │   ├── security.py   # Authentication and security
│   │   └── errors.py     # Error handling
│   ├── db/               # Database connections
│   │   ├── repositories/ # Data access layer
│   │   └── session.py    # Database session management
│   ├── models/           # SQLAlchemy models
│   │   ├── audio/        # Audio-related models
│   │   ├── physics/      # Physics simulation models
│   │   └── universe/     # Universe and scene models
│   ├── schemas/          # Data validation schemas
│   ├── services/         # Business logic services
│   │   └── physics/      # Physics simulation services
│   ├── seeds/            # Database seed data
│   └── static/           # Static files
├── migrations/           # Alembic migrations
├── tests/                # Test suite
└── scripts/              # Utility scripts
```

## Key Components

- Flask web framework
- SQLAlchemy ORM
- Flask-Migrate for database migrations
- Flask-JWT-Extended for authentication
- Flask-SocketIO for WebSocket support
- PostgreSQL database

## Setup

1. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Initialize database:

```bash
flask db upgrade
python create_demo_user.py
```

## Development

1. Start development server:

```bash
python run.py
```

2. Verify API functionality:

```bash
python feature_verification.py
```

## API Endpoints

The API provides the following main endpoints:

- `/api/auth/*` - Authentication endpoints (register, login, refresh)
- `/api/users/*` - User profile management
- `/api/universes/*` - Universe CRUD operations
- `/api/scenes/*` - Scene management within universes
- `/api/physics-parameters/*` - Physics simulation parameters
- `/api/audio/*` - Audio generation and management

## Recent Fixes

- Fixed SQLAlchemy relationship between Universe and PhysicsParameters models
- Resolved UUID comparison issues in authorization checks
- Added proper timestamp handling in model serialization
- Implemented audio file generation for testing purposes
- Consolidated duplicate model definitions

## Testing

- Feature verification: `python feature_verification.py`
- Music API testing: `python test_music_api.py`

## Deployment

1. Build Docker image:

```bash
docker build -t harmonic-universe-backend .
```

2. Run container:

```bash
docker run -p 8000:8000 harmonic-universe-backend
```
