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

## Technology Stack

- **Framework**: Flask
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Authentication**: JWT
- **API**: RESTful APIs
- **Documentation**: OpenAPI/Swagger

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

## API Overview

See the [API.md](docs/API.md) file for detailed API documentation.

### Core Resources

- **Universes**: Story universes containing scenes, characters, etc.
- **Scenes**: Individual scenes within a universe
- **Characters**: Characters that appear in scenes
- **Notes**: Notes associated with universes, scenes, or characters

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Register a user: `POST /api/auth/register`
2. Log in: `POST /api/auth/login`
3. Use the token in subsequent requests: `Authorization: Bearer <token>`

## Development

### Code Style

- Follow PEP 8 guidelines
- Use Black for code formatting
- Use type hints

### Database Migrations

1. Generate migrations after model changes:

```bash
flask db migrate -m "Description of changes"
```

2. Apply migrations:

```bash
flask db upgrade
```

3. Revert migrations if needed:

```bash
flask db downgrade
```

### Testing

Run tests with pytest:

```bash
pytest
```

## Deployment

For deployment to Render.com:

1. Push changes to your repository
2. Render.com will automatically build and deploy the application
3. Database migrations will be applied during deployment

The deployment configuration is defined in `render.yaml` in the root directory. 
