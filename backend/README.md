# Harmonic Universe Backend

This directory contains the Python Flask backend for the Harmonic Universe application.

## Project Structure

```
backend/
├── app/                  # Main application package
│   ├── api/              # API endpoints and models
│   │   ├── models/       # Database models
│   │   └── routes/       # API route definitions
│   ├── __init__.py       # Application factory
│   ├── config.py         # Configuration settings
│   └── extensions.py     # Flask extensions
├── fixes/                # Deployment fixes (needed for Render)
├── static/               # Static files (consolidated)
├── app.py                # Backward compatibility layer
├── run.py                # Development server script
├── setup_db.py           # Database setup script
├── render-build.sh       # Build script for Render deployment
├── render-start.sh       # Start script for Render deployment
└── wsgi.py               # Production WSGI entry point
```

## Entry Points

The application has several entry points:

- **wsgi.py**: Main entry point for production deployment (using Gunicorn or other WSGI servers)
- **run.py**: Development server script (for local development)
- **app.py**: Backward compatibility wrapper (avoid using this directly)

## Deployment Scripts

- **render-build.sh**: Script for building the application on Render
- **render-start.sh**: Script for starting the application on Render

## Development

For local development:

1. Set up your environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Configure PostgreSQL:

   ```bash
   # Create a PostgreSQL database
   createdb harmonic_universe

   # Update .env file with your PostgreSQL connection string
   echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/harmonic_universe" > ../.env
   ```

3. Run the database setup script:

   ```bash
   python setup_db.py
   ```

4. Run the development server:

   ```bash
   python run.py
   ```

5. The development server will be available at http://localhost:5001

## Production Deployment

For production deployment:

1. Set environment variables:

   ```bash
   export FLASK_APP=wsgi.py
   export FLASK_ENV=production
   export FLASK_DEBUG=0
   ```

2. Start with Gunicorn:
   ```bash
   gunicorn --workers=2 --timeout=120 --bind=0.0.0.0:5000 wsgi:app
   ```

## Database

The application uses SQLAlchemy with PostgreSQL exclusively:

- PostgreSQL is required for both development and production environments
- SQLite is not supported
- Database connection string is configured via the DATABASE_URL env var
- Database setup: `python setup_db.py`

## API Documentation

API documentation is available in the docs directory.

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL (required)
- Redis (optional, for rate limiting)

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install required dependencies:

```bash
pip install -r requirements.txt
```

3. Set up the PostgreSQL database:

```bash
# 1. Create a PostgreSQL database
createdb harmonic_universe

# 2. Update .env file with PostgreSQL connection string:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/harmonic_universe

# 3. Run the setup script
python setup_db.py

# 4. Apply migrations if needed
flask db migrate
flask db upgrade
```

4. Run the development server:

```bash
python run.py
# or
flask run
```

The server will be available at http://localhost:5001.

## Database Configuration

This project requires PostgreSQL for both development and production:

1. For development:

   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/harmonic_universe
   ```

2. For production on Render.com:
   - The connection string is automatically provided by Render.com
   - The `render.yaml` file configures the PostgreSQL database service
   - Database migrations will be applied during deployment

## API Documentation

### Authentication

- POST `/api/auth/login`
- POST `/api/auth/register`
- POST `/api/auth/logout`

### Universes

- GET `/api/universes`
- POST `/api/universes`
- GET `/api/universes/:id`
- PUT `/api/universes/:id`
- DELETE `/api/universes/:id`

### Scenes

- GET `/api/scenes`
- POST `/api/scenes`
- GET `/api/scenes/:id`
- PUT `/api/scenes/:id`
- DELETE `/api/scenes/:id`

## Deployment

For deployment to Render.com:

1. Configure PostgreSQL as described above
2. Push changes to your repository
3. Render.com will automatically build and deploy the application

The deployment configuration is defined in `render.yaml` in the root directory.
