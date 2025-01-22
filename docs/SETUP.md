# Setup Guide

## Prerequisites

### System Requirements

- Python 3.8+
- Node.js 16+
- npm 8+ or yarn 1.22+
- PostgreSQL 13+ (for production)
- Redis (for WebSocket scaling)

### Development Tools

- Git
- Visual Studio Code (recommended)
- Docker (optional, for containerization)
- k6 (optional, for load testing)

## Initial Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/harmonic-universe.git
   cd harmonic-universe
   ```

2. **Environment Setup**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit environment variables
   nano .env
   ```

   Required variables:

   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/harmonic_universe
   REDIS_URL=redis://localhost:6379/0
   SECRET_KEY=your-secret-key
   AI_API_KEY=your-ai-service-key
   ```

## Backend Setup

1. **Create Virtual Environment**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. **Install Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Database Setup**

   ```bash
   # Create database
   createdb harmonic_universe

   # Run migrations
   flask db upgrade
   ```

4. **Start Backend Server**

   ```bash
   # Development
   flask run

   # Production
   gunicorn -w 4 -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -b 0.0.0.0:5000 wsgi:app
   ```

## Frontend Setup

1. **Install Dependencies**

   ```bash
   cd frontend
   npm install   # or: yarn install
   ```

2. **Development Server**

   ```bash
   npm run dev   # or: yarn dev
   ```

3. **Production Build**
   ```bash
   npm run build   # or: yarn build
   npm run preview # or: yarn preview
   ```

## WebSocket Setup

1. **Redis Installation**

   ```bash
   # MacOS
   brew install redis
   brew services start redis

   # Ubuntu
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. **WebSocket Configuration**
   ```env
   WEBSOCKET_URL=ws://localhost:5000/ws
   REDIS_URL=redis://localhost:6379/0
   ```

## AI Integration Setup

1. **API Key Configuration**

   ```env
   AI_SERVICE_URL=https://api.ai-service.com
   AI_API_KEY=your-api-key
   ```

2. **Model Configuration**
   ```env
   AI_MODEL_VERSION=v3
   AI_TEMPERATURE=0.7
   AI_MAX_TOKENS=1000
   ```

## Testing Setup

1. **Backend Tests**

   ```bash
   cd backend
   pytest

   # With coverage
   pytest --cov=app tests/
   ```

2. **Frontend Tests**

   ```bash
   cd frontend
   npm test        # or: yarn test
   npm run e2e     # or: yarn e2e
   ```

3. **Load Tests**
   ```bash
   k6 run k6.config.js
   ```

## Development Tools

### VSCode Extensions

- Python
- ESLint
- Prettier
- GitLens
- Python Test Explorer
- REST Client

### Configuration Files

```json
// .vscode/settings.json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Production Deployment

1. **Database Setup**

   ```bash
   # Create production database
   createdb harmonic_universe_prod

   # Run migrations
   FLASK_ENV=production flask db upgrade
   ```

2. **Environment Configuration**

   ```env
   FLASK_ENV=production
   DATABASE_URL=postgresql://user:pass@prod-db:5432/harmonic_universe_prod
   REDIS_URL=redis://prod-redis:6379/0
   ```

3. **Build and Deploy**

   ```bash
   # Build frontend
   cd frontend
   npm run build

   # Deploy using script
   ./deploy.sh
   ```

## Troubleshooting

### Common Issues

1. **Database Connection**

   ```bash
   # Check PostgreSQL status
   pg_isready

   # Reset database
   dropdb harmonic_universe
   createdb harmonic_universe
   flask db upgrade
   ```

2. **Node Modules**

   ```bash
   # Clear node_modules
   rm -rf node_modules
   npm install
   ```

3. **Redis Connection**

   ```bash
   # Check Redis status
   redis-cli ping

   # Clear Redis cache
   redis-cli flushall
   ```

### Getting Help

1. Check the [FAQ](FAQ.md) for common issues
2. Search existing [GitHub Issues](https://github.com/yourusername/harmonic-universe/issues)
3. Join our [Discord community](https://discord.gg/harmonic-universe)

## Security Notes

1. **Environment Variables**

   - Never commit `.env` files
   - Use strong, unique keys
   - Rotate keys regularly

2. **API Keys**

   - Store securely
   - Use appropriate scopes
   - Monitor usage

3. **Database**
   - Regular backups
   - Access control
   - Connection encryption
