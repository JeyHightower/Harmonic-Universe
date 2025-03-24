# Deployment Guide

## Overview

This guide covers the deployment process for both the frontend and backend components of the Harmonic Universe application.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- Node.js 16+ and Yarn
- Python 3.8+
- SSL certificates for production

## Environment Setup

### Backend Environment

1. Create production environment file:

   ```bash
   cp backend/.env.example backend/.env.production
   ```

   Required variables:

   ```
   DATABASE_URL=postgresql://user:password@host:5432/db
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

### Frontend Environment

1. Create production environment file:

   ```bash
   cp frontend/.env.example frontend/.env.production
   ```

   Required variables:

   ```
   VITE_API_URL=https://api.your-domain.com
   VITE_WS_URL=wss://api.your-domain.com
   ```

## Docker Deployment

1. Build images:

   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. Start services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Manual Deployment

### Backend Deployment

1. Create virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. Install production dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:

   ```bash
   flask db upgrade
   ```

4. Start with Gunicorn:
   ```bash
   gunicorn --workers 4 --bind 0.0.0.0:5000 'app:create_app()'
   ```

### Frontend Deployment

1. Install dependencies:

   ```bash
   yarn install --frozen-lockfile
   ```

2. Build for production:

   ```bash
   yarn build
   ```

3. Serve with Nginx:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/dist;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## SSL Configuration

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Configure Nginx SSL:

   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       # ... rest of configuration
   }
   ```

## Monitoring

- Set up application monitoring (e.g., Sentry)
- Configure server monitoring (e.g., Prometheus)
- Set up log aggregation (e.g., ELK Stack)

## Backup Strategy

1. Database backups:

   ```bash
   pg_dump -U user database > backup.sql
   ```

2. Schedule regular backups:
   ```cron
   0 0 * * * /path/to/backup-script.sh
   ```

## Troubleshooting

Common issues and solutions:

1. Database connection issues:

   - Check DATABASE_URL
   - Verify network connectivity
   - Check database permissions

2. Frontend 404 errors:

   - Verify Nginx configuration
   - Check build output
   - Confirm routing setup

3. WebSocket connection issues:
   - Check SSL configuration
   - Verify CORS settings
   - Confirm proxy setup
