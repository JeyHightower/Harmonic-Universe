# Harmonic Universe

A modern web application for music visualization and analysis.

## Project Structure

```
harmonic-universe/
├── backend/                 # FastAPI backend application
│   ├── app/                # Application source code
│   ├── tests/              # Backend tests
│   ├── data/               # Database and data files
│   ├── uploads/            # User uploaded files
│   └── docs/               # Backend documentation
├── frontend/               # React frontend application
│   ├── src/                # Source files
│   ├── public/             # Static files
│   └── tests/              # Frontend tests
└── docs/                   # Project documentation
```

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis 7+

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/harmonic-universe.git
   cd harmonic-universe
   ```

2. Start the development environment:

   ```bash
   docker-compose up
   ```

   This will start:

   - Backend API (http://localhost:3005)
   - Frontend dev server (http://localhost:3000)
   - PostgreSQL database
   - Redis cache
   - Adminer (http://localhost:8080)

3. For local development without Docker:

   Backend:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt -r requirements-test.txt
   uvicorn app.main:app --reload --port 3001
   ```

   Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Testing

Backend tests:

```bash
cd backend
pytest
```

Frontend tests:

```bash
cd frontend
npm test
```

## Documentation

- Backend API documentation: http://localhost:3005/docs
- Frontend documentation: See frontend/README.md
- Project documentation: See docs/

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
