# Harmonic-Universe

A full-stack application built for App Academy capstone project.

## Project Structure

- `frontend/` - React/Vite frontend application
- `backend/` - Python backend application
- `scripts/` - Utility scripts
- `docs/` - Documentation

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
poetry install
poetry run python run.py
```

## Docker

The application can be run using Docker:

```bash
docker-compose up
```

## Deployment

This application is configured for deployment on Render. See `DEPLOYMENT.md` for details.
