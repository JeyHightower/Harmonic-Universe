# Backend Service

## Overview

The backend service is built with Flask and SQLAlchemy, providing a robust API for the Harmonic Universe application.

## Directory Structure

```
backend/
├── app/                  # Application package
│   ├── api/             # API routes and controllers
│   ├── core/            # Core functionality
│   ├── db/              # Database models and migrations
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── migrations/          # Alembic migrations
├── tests/              # Test suite
└── scripts/            # Utility scripts
```

## Key Components

- Flask web framework
- SQLAlchemy ORM
- Flask-Migrate for database migrations
- Flask-JWT-Extended for authentication
- Flask-SocketIO for WebSocket support
- Redis for caching and session management

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
python scripts/init_db.py
```

## Development

1. Start development server:

```bash
flask run
```

2. Run tests:

```bash
pytest
```

## API Documentation

API documentation is available at `/docs` when running in development mode.

## Best Practices

1. Follow PEP 8 style guide
2. Write tests for new features
3. Update migrations for model changes
4. Use type hints
5. Document new endpoints

## Testing

- Unit tests: `pytest tests/unit`
- Integration tests: `pytest tests/integration`
- Coverage report: `pytest --cov=app tests/`

## Deployment

1. Build Docker image:

```bash
docker build -t harmonic-universe-backend .
```

2. Run container:

```bash
docker run -p 5000:5000 harmonic-universe-backend
```
