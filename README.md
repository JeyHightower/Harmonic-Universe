# Harmonic Universe

A real-time collaborative audio visualization and storytelling platform.

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
- Python 3.8+
- PostgreSQL
- Redis

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/harmonic-universe.git
cd harmonic-universe
```

2. Install dependencies:

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/harmonic_universe
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret

# Frontend (.env)
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws
```

4. Initialize the database:

```bash
cd backend
flask db upgrade
flask seed all
```

### Development

1. Start the backend server:

```bash
cd backend
flask run
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

### Testing

Run backend tests:

```bash
cd backend
pytest
```

Run frontend tests:

```bash
cd frontend
npm test
```

### Production Build

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Deploy using the deployment script:

```bash
./deploy.sh
```

## Deployment

The application is configured for deployment on render.com. Follow these steps:

1. Create a new Web Service on render.com
2. Connect your GitHub repository
3. Configure environment variables
4. Set the build command: `./deploy.sh`
5. Set the start command: `gunicorn app:app`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
