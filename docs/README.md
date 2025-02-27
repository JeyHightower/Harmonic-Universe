# Harmonic Universe

Harmonic Universe is an innovative web application that creates immersive audio-visual experiences by combining physics simulations, real-time music generation, and dynamic visualizations. The application allows users to create and explore unique "universes" where physical parameters directly influence musical harmony and visual effects.

## Features

### Universe Creation and Management

- Create personalized universes with custom physics and harmony parameters
- Real-time parameter adjustment
- Public/private universe sharing
- Story point system for creating narrative experiences

### Physics Engine

- Real-time particle physics simulation
- Customizable parameters:
  - Gravity
  - Air resistance
  - Elasticity
  - Friction
- Force field system
- Collision detection and response

### Music Generation

- AI-powered real-time music generation
- Multiple musical styles:
  - Ambient
  - Electronic
  - Classical
  - Jazz
  - Cinematic
  - Experimental
- Mood-based generation:
  - Calm
  - Energetic
  - Melancholic
  - Uplifting
  - Mysterious
  - Intense
- Parameter control:
  - Tempo
  - Complexity
  - Harmony
  - Rhythm

### Visualization System

- Real-time WebGL rendering
- Multiple visualization types:
  - Spectrum analysis
  - Waveform display
  - Particle effects
  - Kaleidoscope patterns
- Post-processing effects:
  - Bloom
  - Custom shaders
  - Anti-aliasing

### Audio Analysis

- Real-time frequency analysis
- Waveform visualization
- Multi-band audio processing
- Dynamic parameter mapping

### AI Integration

- Intelligent parameter suggestions
- Style transfer between universes
- Advanced music generation algorithms

## Tech Stack

### Backend

- Python with Flask
- SQLAlchemy ORM
- PostgreSQL Database
- Redis for caching
- WebSocket support via Flask-SocketIO

### Frontend

- React for UI components
- Redux for state management
- React Router for navigation
- Socket.IO for real-time features

### Infrastructure

- Docker containerization
- Nginx for reverse proxy
- JWT authentication
- WebSocket protocol

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20.x or higher
- Python 3.9 or higher
- PostgreSQL 13 or higher
- Redis 7 or higher

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/harmonic-universe.git
cd harmonic-universe
```

2. Create and configure environment files:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

3. Build and start the containers:

```bash
docker-compose up --build
```

4. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/docs
- Flower (Celery monitoring): http://localhost:5555

## Development

### Backend Setup

1. Install Python dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Initialize the database:

```bash
flask db upgrade
python scripts/init_db.py
```

### Frontend Setup

1. Install Node.js dependencies:

```bash
cd frontend
npm install
```

2. Start development server:

```bash
npm run dev
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React and Redux communities for frontend framework
- Flask community for backend framework
- SQLAlchemy community for ORM
- All other open source contributors
