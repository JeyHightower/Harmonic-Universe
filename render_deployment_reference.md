# Render Deployment Reference

## Build Command
```bash
# Build frontend
cd frontend && npm install && npm run build && cd ..
# Build backend
pip install -r backend/requirements.txt
pip install psycopg2
flask db upgrade
flask seed all
```

## Start Command
```bash
cd backend && gunicorn app.main:app
```

## Required Environment Variables
- FLASK_ENV: production
- FLASK_APP: backend/app
- SECRET_KEY: (generate secure key)
- SCHEMA: harmonic_universe_schema
- REACT_APP_BASE_URL: (your Render.com URL)
- DATABASE_URL: (your Postgres database URL)

## Important Notes
- You must re-create your database instance every 25-30 days (free tier limitation)
- Set calendar reminders to avoid application downtime
- Don't include print statements, console.logs, or debuggers in production code
