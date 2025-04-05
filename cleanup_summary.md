# Backend Cleanup and Consolidation Summary

## Entry Point Files

### Cleaned Up and Consolidated:

1. **wsgi.py** - Main production entry point with proper logging
2. **run.py** - Development-specific server with debugging enabled
3. **app.py** - Simplified backward compatibility layer
4. **.flaskenv** - Updated to point to wsgi.py

## Directory Structure

- Removed nested `static/static` directory
- Removed nested `static/assets/assets` directory
- Preserved `_redirects` file by moving it to `static/assets/`

## Scripts

- Updated **render-start.sh** script to:
  - Set appropriate environment variables
  - Fix Python path issues
  - Check if static directory exists
  - Perform database health check
  - Run database migrations if needed
  - Start the application in correct mode (development/production)

## File Hierarchy

The backend now has a clear structure:

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

## Recommendations for Future Maintenance:

1. Use `wsgi.py` for production deployments with Gunicorn
2. Use `run.py` for local development
3. Avoid direct use of `app.py` (exists only for backward compatibility)
4. Use `render-start.sh` for Render deployments
5. Use `render-build.sh` for building the application on Render

## Key Configuration Settings:

- Production port: 5000 (configurable via PORT env var)
- Development port: 5001
- Database path: `instance/app.db` (configurable via DATABASE_URL env var)
- Static files: served from `backend/static`
