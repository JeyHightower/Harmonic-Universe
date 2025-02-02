# Harmonic Universe Backend

A modern Python backend built with FastAPI, SQLAlchemy, and WebSocket support.

## Project Structure

```
backend/
├── app/                    # Application package
│   ├── api/               # API endpoints
│   ├── core/              # Core functionality
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── routes/            # Route handlers
│   └── db/                # Database configuration
├── tests/                 # Test suite
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── logs/                  # Application logs
│   ├── app/              # General app logs
│   ├── error/            # Error logs
│   └── access/           # Access logs
├── scripts/              # Utility scripts
│   ├── db/              # Database scripts
│   └── deployment/      # Deployment scripts
├── migrations/           # Alembic migrations
├── alembic/             # Alembic configuration
├── config.py            # Configuration settings
├── requirements.txt     # Project dependencies
└── manage.py           # Management commands
```

## Getting Started

1. Create and activate virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
cp .env.example .env
   # Edit .env with your settings
```

4. Initialize database:

```bash
   python manage.py db upgrade
   python manage.py seed  # Optional: seed initial data
```

5. Run development server:

```bash
   python manage.py runserver
```

## Available Commands

- `python manage.py runserver` - Run development server
- `python manage.py test` - Run tests
- `python manage.py db upgrade` - Run database migrations
- `python manage.py db migrate` - Generate new migration
- `python manage.py shell` - Open Python shell with app context
- `python manage.py seed` - Seed initial data
- `python manage.py routes` - List all routes

## API Documentation

- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

## Testing

Run tests with coverage:

```bash
python -m pytest --cov=app tests/
```

## Development Guidelines

1. Follow PEP 8 style guide
2. Write tests for new features
3. Update migrations for model changes
4. Document API endpoints
5. Use type hints
6. Follow REST best practices

## Dependencies

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- pytest
- WebSocket
- uvicorn

## Deployment

1. Build Docker image:

```bash
   docker build -t harmonic-universe-backend .
```

2. Run container:

```bash
   docker run -p 5000:5000 harmonic-universe-backend
```

## Environment Variables

- `FLASK_ENV` - Environment (development/production)
- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - Application secret key
- `REDIS_URL` - Redis connection string (optional)
- `LOG_LEVEL` - Logging level

# Database Management

This document describes how to manage the database for the Harmonic Universe backend.

## Setup

The backend uses SQLAlchemy as the ORM and Alembic for database migrations. The database schema is defined in the `app/models` directory.

## Database Operations

We provide a command-line tool `scripts/db_ops.py` for common database operations:

### Initialize Database

To initialize the main database:

```bash
./scripts/db_ops.py init
```

To initialize the test database:

```bash
./scripts/db_ops.py init --test
```

### Migrations

Create a new migration:

```bash
./scripts/db_ops.py create-migration "description_of_changes"
```

Apply all pending migrations:

```bash
./scripts/db_ops.py migrate
```

### Verify Database

To verify the database schema and connections:

```bash
./scripts/db_ops.py verify
```

## Development Workflow

1. Make changes to models in `app/models/`
2. Create a new migration:
   ```bash
   ./scripts/db_ops.py create-migration "description_of_changes"
   ```
3. Review the generated migration in `migrations/versions/`
4. Apply the migration:
   ```bash
   ./scripts/db_ops.py migrate
   ```
5. Verify the changes:
   ```bash
   ./scripts/db_ops.py verify
   ```

## Testing

The test suite uses a separate SQLite database. Before running tests, ensure the test database is properly initialized:

```bash
./scripts/db_ops.py init --test
```

## Troubleshooting

If you encounter database-related issues:

1. Verify the database connection:

   ```bash
   ./scripts/db_ops.py verify
   ```

2. Check the logs for detailed error messages

3. If needed, you can reinitialize the database:
   ```bash
   ./scripts/db_ops.py init
   ```

## Notes

- The main database configuration is in `app/core/config.py`
- Test database configuration is in `app/core/test_config.py`
- Migration scripts are stored in `migrations/versions/`
- Database models are in `app/models/`
