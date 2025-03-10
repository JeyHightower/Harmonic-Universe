# Render Deployment Reference

## Build Command

```bash
# Build frontend
cd frontend && npm install && npm run build && cd ..
# Build backend
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python -m pip install psycopg2
python -m pip install gunicorn==21.2.0
cd backend && python -m flask db upgrade
cd backend && python -m flask seed all
```

## Start Command

```bash
cd backend
export PYTHONPATH=$PYTHONPATH:$(pwd)
exec gunicorn --log-level debug app.main:app
```

## Required Environment Variables

- FLASK_ENV: production
- FLASK_APP: backend/app
- SECRET_KEY: (generate secure key)
- SCHEMA: harmonic_universe_schema
- PYTHONUNBUFFERED: true
- PYTHONPATH: /opt/render/project/src:/opt/render/project/src/backend
- REACT_APP_BASE_URL: (your Render.com URL)
- DATABASE_URL: (your Postgres database URL)

## Important Notes

- You must re-create your database instance every 25-30 days (free tier limitation)
- Set calendar reminders to avoid application downtime
- Don't include print statements, console.logs, or debuggers in production code
