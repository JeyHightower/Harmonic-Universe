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

## Setup and Installation

1. Create a virtual environment (recommended):

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

3. Set up the database:

   ```
   # Initialize migrations (first time only)
   flask db init

   # Create a migration after model changes
   flask db migrate -m "Your migration message"

   # Apply migrations
   flask db upgrade
   ```

## Running the Application

### Development Mode

```
cd backend
python run.py
```

The server will run on port 10000 by default (http://localhost:10000).

### Using WSGI Server (Production)

```
cd backend
gunicorn wsgi:app
```

## Testing

1. Run the test setup script:

   ```
   ./test_setup.sh
   ```

   This script will:

   - Set the TEST_PORT environment variable to 8000
   - Install required dependencies
   - Apply database migrations
   - Start the Flask server
   - Run the tests
   - Clean up the test environment

2. Alternatively, you can run tests manually:

   ```
   # Set testing port
   export TEST_PORT=8000

   # Start the server in test mode
   cd backend
   python run.py &

   # Run the tests
   cd ..
   npm test
   ```

## Configuration

- The application uses environment variables for configuration:
  - `PORT`: The port to run the server on (default: 10000)
  - `TEST_PORT`: Port for test environment (default: 8000)
  - `DATABASE_URL`: Database connection string
  - `SECRET_KEY`: Secret key for session management
  - `FLASK_ENV`: Environment (development, testing, production)

## Project Structure

- `app.py`: Main application factory and routes
- `wsgi.py`: WSGI entry point for production servers
- `run.py`: Development server script
- `migrations/`: Alembic database migrations
- `static/`: Static files served by the application
- `tests/`: Test files
- `scripts/`: Utility scripts for project management

## Troubleshooting

If you encounter import errors or path issues:

1. Make sure your Python path includes the backend directory
2. Check that all required dependencies are installed
3. Run `python backend/scripts/verify_migrations.py` to check database migration status

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

## Deployment

1. Build Docker image:

```

```
