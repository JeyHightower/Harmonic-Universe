# Harmonic Universe

A dynamic web application for creating and exploring musical universes with physics-based interactions.

## Project Structure

```
harmonic-universe/
├── backend/           # Python backend server
│   ├── app/          # Application code
│   ├── tests/        # Backend tests
│   └── requirements.txt
├── frontend/         # React frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   ├── cypress.config.js
│   ├── k6.config.js
│   └── vitest.config.js
├── config/          # Global configuration
│   └── .env        # Environment variables
├── docs/           # Documentation
├── scripts/        # Utility scripts
├── tests/          # Integration tests
└── .github/        # GitHub workflows and templates
```

## Features

### Authentication

- User registration and login
- Token-based authentication with refresh mechanism
- Secure session management
- Password reset functionality

### Real-time Communication

- WebSocket-based real-time updates
- Heartbeat monitoring for connection health
- Automatic reconnection with exponential backoff
- Circuit breaker pattern for failure handling

### Error Handling

- Global error boundary for React components
- Categorized error handling (network, auth, business logic)
- Toast notification system
- Error tracking and reporting

### Audio Processing

- Real-time audio visualization
- Frequency analysis
- Waveform display
- Resource cleanup and memory management

### UI Components

- Toast notifications (success, error, warning, info)
- Loading indicators
- Error messages with different severity levels
- Responsive design

### Universe Management

- Create and edit universes
- Collaborative storyboard
- Analytics dashboard
- Real-time updates

## Setup

### Prerequisites

- Node.js (v16 or higher)
- Python 3.9+
- Yarn package manager

### Backend Setup

```bash
cd backend
./setup.sh
```

### Frontend Setup

```bash
cd frontend
yarn install
```

### Environment Configuration

1. Copy the example environment file:

```bash
cp config/.env.example config/.env
```

2. Update the environment variables as needed.

## Development

### Running the Backend

```bash
cd backend
python -m flask run
```

### Running the Frontend

```bash
cd frontend
yarn dev
```

### Running Tests

Backend tests:

```bash
cd backend
pytest
```

Frontend tests:

```bash
cd frontend
yarn test
```

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
