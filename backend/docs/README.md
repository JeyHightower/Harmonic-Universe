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
├── docs/                 # Documentation
├── fixes/                # Fixes for deployment issues
├── migrations/           # Database migrations
├── static/               # Static files served by the backend
├── utils/                # Utility scripts
├── app.py                # App entry point (for backward compatibility)
├── run.py                # Development server script
├── setup_db.py           # Database setup and migration script
└── wsgi.py               # WSGI entry point for production
```

## Entry Points

The application has several entry points:

- **wsgi.py**: Main entry point for production deployment (using Gunicorn or other WSGI servers)
- **run.py**: Development server script (for local development)
- **app.py**: Backward compatibility wrapper around the Flask app factory

## Utilities

- **setup_db.py**: Consolidated script for database management:

  - Setting up a fresh database
  - Creating tables
  - Managing migrations

- **utils/user_management.py**: User management utility:
  - List users
  - Create users
  - Update passwords
  - Reset demo user
  - Delete users

Example usage:

```bash
# List all users
python backend/utils/user_management.py list

# Create a new user
python backend/utils/user_management.py create username email@example.com password

# Update a user's password
python backend/utils/user_management.py update-password username new_password

# Reset the demo user
python backend/utils/user_management.py reset-demo

# Delete a user
python backend/utils/user_management.py delete username
```

## Configuration

Configuration is managed through environment variables and the `app/config.py` file.
Key configuration settings:

- `FLASK_ENV`: Set to `development`, `testing`, or `production`
- `AUTO_CREATE_TABLES`: Whether to automatically create database tables on app startup (default: false)
- `DATABASE_URL`: Database connection string

## Development

For local development:

1. Set up your environment:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Set up the database:

   ```bash
   python setup_db.py
   ```

3. Run the development server:
   ```bash
   python run.py
   ```

The server will be available at http://localhost:5001 by default.
