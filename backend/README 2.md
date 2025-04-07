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

2. Run the development server:

   ```bash
   python run.py
   ```

3. The development server will be available at http://localhost:5001

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

The application uses SQLAlchemy with SQLite by default:

- Database path: `instance/app.db` (configurable via DATABASE_URL env var)
- Database setup: `python setup_db.py`

## API Documentation

API documentation is available in the docs directory.
