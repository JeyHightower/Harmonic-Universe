# Harmonic Universe Backend

## Project Structure

```
backend/
├── app/                      # Application package
│   ├── api/                  # API endpoints and routes
│   │   └── v1/              # API version 1
│   │       ├── api.py       # API router setup
│   │       └── endpoints/   # API endpoint modules
│   ├── core/                # Core application modules
│   │   ├── config/         # Configuration settings
│   │   ├── db/            # Database core functionality
│   │   └── errors/        # Error handling
│   ├── models/             # Database models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic services
│   ├── crud/               # Database CRUD operations
│   ├── utils/              # Utility functions
│   └── websocket/          # WebSocket handlers
├── tests/                   # Test suite
├── migrations/              # Database migrations
└── scripts/                # Utility scripts
```

## Key Components

- `api/`: Contains all API endpoints organized by version
- `core/`: Core application functionality and configuration
- `models/`: SQLAlchemy database models
- `schemas/`: Pydantic models for request/response validation
- `services/`: Business logic implementation
- `crud/`: Database operations
- `utils/`: Helper functions and utilities
- `websocket/`: Real-time communication handlers

## Development Setup

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
# Edit .env with your configuration
```

4. Run database migrations:

```bash
alembic upgrade head
```

5. Start development server:

```bash
uvicorn app.main:app --reload
```

## Testing

Run tests with:

```bash
pytest
```

## API Documentation

Once the server is running, access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Available Commands

- `python manage.py runserver` - Run development server
- `python manage.py test` - Run tests
- `python manage.py db upgrade` - Run database migrations
- `python manage.py db migrate` - Generate new migration
- `python manage.py shell` - Open Python shell with app context
- `python manage.py seed` - Seed initial data
- `python manage.py routes` - List all routes

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

# Backend Utilities Documentation

This document provides an overview of the utility functions available in the backend application.

## Table of Contents

- [Security Utilities](#security-utilities)
- [Logging Utilities](#logging-utilities)
- [Error Handling Utilities](#error-handling-utilities)
- [Configuration Utilities](#configuration-utilities)
- [Caching Utilities](#caching-utilities)
- [Monitoring Utilities](#monitoring-utilities)
- [Testing Utilities](#testing-utilities)

## Security Utilities

Located in `utils/security.py`, these utilities provide secure token generation, encryption, and data protection.

### Key Functions:

- `generate_token(length: int = 32)`: Generate secure random tokens
- `generate_api_key()`: Generate secure API keys
- `create_jwt_token(data: dict, secret_key: str)`: Create JWT tokens
- `verify_jwt_token(token: str, secret_key: str)`: Verify JWT tokens
- `encrypt_data(data: str, key: bytes)`: Encrypt data using Fernet
- `decrypt_data(encrypted_data: bytes, key: bytes)`: Decrypt data
- `hash_data(data: str, salt: Optional[str] = None)`: Hash data with optional salt

## Logging Utilities

Located in `utils/logging.py`, these utilities provide structured logging capabilities.

### Key Functions:

- `setup_logger(name: str, log_file: Optional[str] = None)`: Configure logger
- `log_exception(logger: logging.Logger, exc: Exception)`: Log exceptions
- `rotate_logs(log_dir: Union[str, Path])`: Manage log rotation
- `log_to_json(logger: logging.Logger, level: int, message: str)`: JSON logging
- `log_performance(logger: logging.Logger)`: Performance logging decorator

## Error Handling Utilities

Located in `utils/errors.py`, these utilities provide standardized error handling.

### Key Components:

- `ErrorSeverity`: Enum for error severity levels
- `ErrorCategory`: Enum for error categories
- `AppError`: Base application error class
- `handle_exceptions(logger: logging.Logger)`: Exception handling decorator
- `validate_or_raise(condition: bool, message: str)`: Validation helper

## Configuration Utilities

Located in `utils/config.py`, these utilities manage application configuration.

### Key Functions:

- `load_config(config_path: Union[str, Path])`: Load configuration files
- `merge_configs(*configs: Dict[str, Any])`: Merge multiple configs
- `load_env_vars(env_file: Optional[str] = None)`: Load environment variables
- `validate_config(config: Dict[str, Any])`: Validate configuration

## Caching Utilities

Located in `utils/cache.py`, these utilities provide caching functionality.

### Key Components:

- `Cache`: In-memory cache implementation
- `cache_decorator`: Function result caching decorator
- Methods for get, set, delete, and cleanup operations

## Monitoring Utilities

Located in `utils/monitoring.py`, these utilities monitor application performance.

### Key Components:

- `RequestMetrics`: Track request-level metrics
- `ResourceMetrics`: Track system resource metrics
- `PerformanceMonitor`: Monitor system performance
- `monitor_performance`: Performance monitoring decorator

## Testing Utilities

Located in `utils/testing.py`, these utilities facilitate testing.

### Key Functions:

- `random_string()`, `random_email()`, `random_password()`: Generate test data
- `temp_dir()`, `temp_file()`: Temporary file handling fixtures
- `mock_datetime()`: DateTime mocking context manager
- `TestClient`: API testing client
- Database testing utilities

## Installation

1. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage Examples

### Security Example

```python
from utils.security import generate_token, encrypt_data

# Generate a secure token
token = generate_token(length=32)

# Encrypt sensitive data
key = generate_encryption_key()
encrypted_data, iv = encrypt_data("sensitive information", key)
```

### Logging Example

```python
from utils.logging import setup_logger

# Setup application logger
logger = setup_logger("app_logger", "logs/app.log")
logger.info("Application started")
```

### Error Handling Example

```python
from utils.errors import handle_exceptions, ValidationError

@handle_exceptions(logger)
def process_data(data):
    if not data:
        raise ValidationError("Data cannot be empty")
    return data
```

### Configuration Example

```python
from utils.config import load_config, load_env_vars

# Load configuration
config = load_config("config.yaml")
env_vars = load_env_vars(".env")
```

## Contributing

1. Follow the project's coding standards
2. Write tests for new functionality
3. Update documentation as needed
4. Submit pull requests for review

## License

This project is licensed under the MIT License - see the LICENSE file for details.
