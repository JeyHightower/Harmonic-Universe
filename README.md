# Harmonic Universe

A real-time interactive universe simulation platform that combines physics, music, and visualization.

## Features

### Core Features
- **User Authentication**
  - Secure login/registration
  - Profile management
  - Session handling

- **Universe Management**
  - Create, read, update, delete universes
  - Privacy controls
  - Real-time parameter updates
  - Export functionality

- **Physics Engine**
  - Gravity simulation
  - Particle interactions
  - Collision detection
  - Custom physics parameters

- **Music Integration**
  - Real-time music generation
  - Harmony controls
  - Scale selection
  - Tempo management

- **Visualization**
  - Custom color schemes
  - Particle effects
  - Trail visualization
  - Grid and axes options

- **Real-time Collaboration**
  - WebSocket integration
  - Live parameter updates
  - Presence indicators
  - Collaborative editing

### Additional Features
- **Storyboard System**
  - Create and manage story elements
  - Harmony value tracking
  - Sequential organization

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- Material-UI for components
- Socket.IO for real-time communication
- Cypress for E2E testing

### Backend
- Flask
- SQLAlchemy
- Flask-SocketIO
- PostgreSQL
- pytest for testing

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Python (3.8+)
- PostgreSQL
- Redis (for WebSocket)

### Backend Setup
1. Create and activate virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-test.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Initialize database:
   ```bash
   python create_db.py
   flask db upgrade
   ```

5. Run the server:
   ```bash
   python run.py
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/test_comprehensive.py -v
```

### Frontend Tests
```bash
cd frontend
npm run test:e2e
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Universe Endpoints
- `GET /api/universes` - List universes
- `POST /api/universes` - Create universe
- `GET /api/universes/{id}` - Get universe details
- `PUT /api/universes/{id}` - Update universe
- `DELETE /api/universes/{id}` - Delete universe
- `PUT /api/universes/{id}/parameters/{type}` - Update parameters
- `GET /api/universes/{id}/export` - Export universe data

### Storyboard Endpoints
- `GET /api/storyboards` - List storyboards
- `POST /api/storyboards` - Create storyboard
- `GET /api/storyboards/{id}` - Get storyboard details
- `PUT /api/storyboards/{id}` - Update storyboard
- `DELETE /api/storyboards/{id}` - Delete storyboard

### WebSocket Events
- `connect` - Client connection
- `disconnect` - Client disconnection
- `join_universe` - Join universe room
- `leave_universe` - Leave universe room
- `parameter_update` - Real-time parameter updates
- `simulation_start` - Start simulation
- `simulation_stop` - Stop simulation
- `simulation_reset` - Reset simulation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
