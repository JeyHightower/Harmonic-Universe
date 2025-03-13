# Backend Documentation

## Overview

The backend is built using Flask and provides a RESTful API for the Harmonic Universe application.

## Technology Stack

- Flask
- SQLAlchemy
- Flask-SocketIO
- PostgreSQL
- JWT Authentication

## API Documentation

### Authentication

- POST `/api/auth/login`
- POST `/api/auth/register`
- POST `/api/auth/refresh`

### User Management

- GET `/api/users/profile`
- PUT `/api/users/profile`
- GET `/api/users/{id}`

### Real-time Features

The application uses WebSocket connections for real-time features:

- User presence
- Live collaboration
- Real-time updates

## Development Setup

1. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # Unix
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run migrations:

   ```bash
   flask db upgrade
   ```

5. Start the development server:
   ```bash
   flask run
   ```

## Testing

Run tests using pytest:

```bash
pytest
```

Test results are stored in `test_results/`

## Database

- We use PostgreSQL as our primary database
- Migrations are handled by Alembic
- See `models.py` for database schema

## Deployment

See the [deployment guide](../deployment/README.md) for production deployment instructions.
