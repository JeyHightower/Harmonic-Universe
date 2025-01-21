# Setup Guide

## Prerequisites

### System Requirements

- Node.js v16 or higher
- Python 3.8 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher
- Git

### Development Tools

- Visual Studio Code (recommended)
- Docker Desktop
- Postman (optional)
- pgAdmin (optional)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/harmonic-universe.git
cd harmonic-universe
```

### 2. Backend Setup

#### Create Python Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create `.env` file in `backend/` directory:

```env
FLASK_APP=run.py
FLASK_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/harmonic_universe
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
```

#### Initialize Database

```bash
flask db upgrade
flask seed all  # If you want sample data
```

### 3. Frontend Setup

#### Install Node.js Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws
```

### 4. Docker Setup (Optional)

#### Build and Run with Docker Compose

```bash
docker-compose up --build
```

## Development

### Start Backend Server

```bash
cd backend
source venv/bin/activate
flask run
```

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

### Run Tests

#### Backend Tests

```bash
cd backend
pytest
```

#### Frontend Tests

```bash
cd frontend
npm test
```

#### End-to-End Tests

```bash
cd frontend
npm run cypress:open
```

## Common Issues

### Database Connection

1. Ensure PostgreSQL is running
2. Check database URL in `.env`
3. Verify database exists
4. Check user permissions

### WebSocket Connection

1. Ensure Redis is running
2. Check WebSocket URL in frontend `.env`
3. Verify CORS settings in backend

### Build Issues

1. Clear node_modules and reinstall
2. Update Python dependencies
3. Check Node.js version
4. Clear browser cache

## Production Deployment

### 1. Build Frontend

```bash
cd frontend
npm run build
```

### 2. Configure Production Environment

Update environment variables for production:

```env
FLASK_ENV=production
DATABASE_URL=your_production_db_url
REDIS_URL=your_production_redis_url
```

### 3. Deploy to render.com

```bash
./deploy.sh
```

## Development Guidelines

### Code Style

- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/React
- Write meaningful commit messages
- Document complex functions and components

### Git Workflow

1. Create feature branch
2. Make changes
3. Run tests
4. Create pull request
5. Wait for review and CI checks

### Testing

1. Write unit tests for new features
2. Update integration tests if needed
3. Run full test suite before committing
4. Maintain test coverage above 80%

## Additional Resources

### Documentation

- [API Documentation](./API.md)
- [Feature List](./FEATURES.md)
- [Testing Guide](./TESTING.md)
- [Deployment Guide](./DEPLOYMENT.md)

### External Links

- [React Documentation](https://reactjs.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

### Getting Help

1. Check existing documentation
2. Search issue tracker
3. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Contributing

1. Read [Contributing Guide](./CONTRIBUTING.md)
2. Fork repository
3. Create feature branch
4. Make changes
5. Submit pull request
