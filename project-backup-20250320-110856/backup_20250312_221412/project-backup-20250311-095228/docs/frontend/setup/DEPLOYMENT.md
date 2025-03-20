# Deployment Guide

## Overview

This guide covers the deployment process for Harmonic Universe, including both staging and production environments.

## Prerequisites

- Linux server (Ubuntu 20.04 LTS recommended)
- Docker and Docker Compose
- Domain name and SSL certificate
- PostgreSQL 13+
- Redis 6+
- Node.js 16+
- Python 3.8+

## Infrastructure Setup

### 1. Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
  nginx \
  postgresql-13 \
  redis-server \
  python3.8 \
  python3.8-venv \
  nodejs \
  npm \
  docker.io \
  docker-compose

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw allow 6379/tcp  # Redis
```

### 2. SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Database Setup

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE harmonic_universe;
CREATE USER harmonic_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE harmonic_universe TO harmonic_user;
\q

# Configure PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf

# Add/modify these lines:
listen_addresses = '*'
max_connections = 100
shared_buffers = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB
```

### 4. Redis Configuration

```bash
sudo nano /etc/redis/redis.conf

# Add/modify these lines:
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
```

## Application Deployment

### 1. Backend Deployment

1. **Clone Repository**

```bash
git clone https://github.com/your-org/harmonic-universe.git
cd harmonic-universe/backend
```

2. **Environment Setup**

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
FLASK_APP=run.py
FLASK_ENV=production
DATABASE_URL=postgresql://harmonic_user:your_password@localhost/harmonic_universe
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
CORS_ORIGIN=https://yourdomain.com
EOL
```

3. **Database Migration**

```bash
flask db upgrade
```

4. **Gunicorn Setup**

```bash
# Create service file
sudo nano /etc/systemd/system/harmonic-backend.service

[Unit]
Description=Harmonic Universe Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 run:app
Restart=always

[Install]
WantedBy=multi-user.target

# Start service
sudo systemctl start harmonic-backend
sudo systemctl enable harmonic-backend
```

### 2. Frontend Deployment

1. **Build Frontend**

```bash
cd frontend
npm install
npm run build
```

2. **NGINX Configuration**

```nginx
# /etc/nginx/sites-available/harmonic-universe

upstream backend {
    server 127.0.0.1:5000;
}

upstream websocket {
    server 127.0.0.1:5001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3. WebSocket Server

```bash
# Create service file
sudo nano /etc/systemd/system/harmonic-websocket.service

[Unit]
Description=Harmonic Universe WebSocket Server
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/python websocket_server.py
Restart=always

[Install]
WantedBy=multi-user.target

# Start service
sudo systemctl start harmonic-websocket
sudo systemctl enable harmonic-websocket
```

## Monitoring Setup

### 1. Application Monitoring

```bash
# Install Prometheus
sudo apt install -y prometheus

# Configure Prometheus
sudo nano /etc/prometheus/prometheus.yml

# Add job configurations for:
# - Node exporter
# - PostgreSQL exporter
# - Redis exporter
# - Application metrics

# Install Grafana
sudo apt install -y grafana

# Configure dashboards for:
# - System metrics
# - Application metrics
# - Database metrics
# - WebSocket metrics
```

### 2. Logging

```bash
# Install ELK Stack
sudo apt install -y elasticsearch logstash kibana

# Configure log shipping
# - Application logs
# - NGINX logs
# - System logs
```

### 3. Error Tracking

```bash
# Install Sentry
docker run -d --name sentry-redis redis
docker run -d --name sentry-postgres postgres
docker run -d --name sentry sentry
```

## Backup Strategy

### 1. Database Backups

```bash
# Create backup script
cat > backup.sh << EOL
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U harmonic_user harmonic_universe > $BACKUP_DIR/db_$TIMESTAMP.sql
EOL

# Schedule daily backups
sudo crontab -e
0 0 * * * /path/to/backup.sh
```

### 2. File Backups

```bash
# Install restic
sudo apt install -y restic

# Configure backups
restic init --repo /path/to/backup/repository

# Schedule backups
sudo crontab -e
0 1 * * * restic backup /path/to/application
```

## Scaling Considerations

### 1. Horizontal Scaling

- Use load balancer (e.g., HAProxy)
- Configure session sharing with Redis
- Set up database replication
- Use CDN for static assets

### 2. Vertical Scaling

- Increase server resources
- Optimize database configuration
- Tune application parameters
- Monitor resource usage

## Security Measures

### 1. Application Security

- Enable rate limiting
- Configure CORS properly
- Use secure headers
- Implement request validation

### 2. Server Security

- Keep system updated
- Configure firewall
- Use fail2ban
- Regular security audits

## Rollback Procedure

### 1. Application Rollback

```bash
# Backend rollback
cd backend
git checkout <previous-version>
flask db downgrade
sudo systemctl restart harmonic-backend

# Frontend rollback
cd frontend
git checkout <previous-version>
npm run build
```

### 2. Database Rollback

```bash
# Restore from backup
psql -U harmonic_user harmonic_universe < backup.sql
```

## Troubleshooting

### 1. Common Issues

1. **Database Connections**

```bash
# Check connections
sudo -u postgres psql
SELECT * FROM pg_stat_activity;
```

2. **WebSocket Issues**

```bash
# Check logs
journalctl -u harmonic-websocket
```

3. **Application Errors**

```bash
# Check logs
journalctl -u harmonic-backend
```

### 2. Performance Issues

1. **Database**

```bash
# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC;
```

2. **Application**

```bash
# Profile application
python -m cProfile app.py
```

## Maintenance

### 1. Regular Tasks

- Monitor disk space
- Rotate logs
- Update SSL certificates
- Check backup integrity

### 2. Updates

- Schedule maintenance windows
- Test updates in staging
- Keep dependencies updated
- Monitor for security updates

Last updated: Thu Jan 30 18:37:47 CST 2025
