# Harmonic Universe

A collaborative platform for creating and exploring interactive universes with customizable physics parameters.

## Features

- **User Management**
  - User registration and authentication
  - Profile management with customizable preferences
  - Secure password hashing and session management

- **Universe Creation**
  - Create and manage multiple universes
  - Customize physics parameters
  - Public and private universe settings

- **Collaboration**
  - Real-time collaboration on universes
  - Add and manage collaborators
  - Track collaborator count and activity

## Tech Stack

### Frontend
- React 18
- TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Styled Components for styling
- Jest and React Testing Library for testing

### Backend
- Python 3.9+
- Flask for API
- SQLAlchemy for ORM
- PostgreSQL for database
- Alembic for migrations
- pytest for testing

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.9+
- PostgreSQL 13+
- Poetry for Python dependency management
- npm or yarn for Node.js dependency management

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/harmonic-universe.git
cd harmonic-universe
```

2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your environment variables
flask db upgrade
flask run
```

3. Frontend Setup
```bash
cd frontend
npm install  # or yarn install
cp .env.example .env  # Configure your environment variables
npm run dev  # or yarn dev
```

## Development

### Directory Structure
```
harmonic-universe/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   └── schemas/
│   ├── migrations/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── store/
│   └── tests/
└── docs/
    ├── api/
    ├── components/
    └── database/
```

### Running Tests

Backend Tests:
```bash
cd backend
pytest
```

Frontend Tests:
```bash
cd frontend
npm test  # or yarn test
```

### Code Style

Backend:
- Follow PEP 8
- Use Black for formatting
- Use isort for import sorting

Frontend:
- Follow ESLint configuration
- Use Prettier for formatting
- Follow React best practices

## API Documentation

API documentation is available at `/docs/api/README.md`

## Component Documentation

Component documentation is available at `/docs/components/README.md`

## Database Schema

Database schema documentation is available at `/docs/database/SCHEMA.md`

## Physics Engine Features

The application includes a powerful 2D physics engine that allows users to create interactive physics simulations within their scenes. Key features include:

### Physics Objects
- Support for multiple object types:
  - Circles with radius and mass
  - Rectangles with width, height, and mass
  - Polygons with custom vertices
- Dynamic and static objects
- Configurable physical properties:
  - Mass and density
  - Friction and restitution
  - Velocity and acceleration
  - Angular velocity and rotation
- Collision detection and response
- Sensor objects for trigger events

### Physics Constraints
- Multiple constraint types:
  - Distance constraints with min/max limits
  - Revolute joints with angle limits
  - Prismatic joints with translation limits
- Configurable properties:
  - Stiffness and damping
  - Anchor points
  - Axis of motion
- Real-time constraint force calculation
- Visual constraint representation

### Scene Integration
- Physics settings per scene:
  - Gravity direction and magnitude
  - Time step configuration
  - Iteration settings
- Real-time simulation controls:
  - Play/pause functionality
  - Step-by-step simulation
  - Reset capability
- Visual debugging tools
- Performance optimization

### User Interface
- Intuitive object creation and editing
- Visual constraint setup
- Real-time property adjustment
- Physics simulation controls
- Object and constraint lists
- Scene-specific settings

For detailed information about using the physics engine, please refer to the [Physics Engine Documentation](docs/PHYSICS_FEATURES.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Testing

### Backend Testing
- Unit tests for models and utilities
- Integration tests for API endpoints
- Test coverage reports

### Frontend Testing
- Component tests with React Testing Library
- Hook tests
- Integration tests for main features

## Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations
4. Start Flask application with gunicorn

### Frontend Deployment
1. Build the frontend application
2. Configure environment variables
3. Serve static files with nginx

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- React and Flask communities
- Contributors and testers
- Open source libraries used in this project

## Contact

- Your Name - [@yourusername](https://twitter.com/yourusername)
- Project Link: [https://github.com/yourusername/harmonic-universe](https://github.com/yourusername/harmonic-universe)
