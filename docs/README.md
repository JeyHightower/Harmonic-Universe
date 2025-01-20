# Harmonic Universe

An interactive web application that generates music and visualizations based on physics simulations.

## Features

- Real-time physics simulation with adjustable parameters
- Dynamic music generation synchronized with physics
- Interactive visualizations responding to music and physics
- Collaborative universe creation and sharing
- AI-powered parameter suggestions
- WebSocket-based real-time updates

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm 8+
- PostgreSQL (for production)

## Setup

### Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

This will:

- Create necessary directories
- Set up a virtual environment
- Install dependencies
- Initialize the database
- Create a .env file with secure keys

3. Start the Flask server:

```bash
flask run
```

### Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Testing

Run the test suite:

```bash
./test_runner.sh
```

This will:

- Run backend tests with pytest and coverage
- Run frontend tests with Jest and coverage
- Generate coverage reports

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── websocket/
│   ├── tests/
│   ├── logs/
│   └── migrations/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── tests/
├── API.md
└── TEST_PLAN.md
```

## API Documentation

See [API.md](API.md) for detailed API documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
