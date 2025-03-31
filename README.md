# Harmonic Universe

A full-stack application for creating and managing interactive harmonic universes. Create scenes, characters, and notes in your universe with rich editing features and physics-based sound generation.

## Features

- **Universe Management**: Create and manage multiple interactive universes
- **Scene Editor**: Design scenes within your universes with detailed properties and relationships
- **Character System**: Add characters to your universe and assign them to specific scenes
- **Note Taking**: Create notes associated with universes, scenes, or characters
- **Physics-Based Sound**: Generate sounds using physics principles within your universe
- **Interactive Dashboard**: Visualize and manage your universe content from a central hub
- **Demo User Login**: Quick access to try out the application without registration
- **Responsive Design**: Seamless experience across desktop and mobile devices

## Tech Stack

### Frontend

- **React 18** with **Vite** for fast development and optimized builds
- **Redux** and **Redux Toolkit** for state management
- **React Router** for client-side routing
- **Ant Design** and **Material UI** for UI components
- **Axios** for API requests
- **Three.js** for 3D visualizations
- **Tone.js** for audio generation

### Backend

- **Flask** web framework
- **SQLAlchemy ORM** for database operations
- **Flask-JWT-Extended** for authentication
- **PostgreSQL** for production and **SQLite** for development
- **Flask-Migrate** for database migrations
- **Flask-SocketIO** for real-time communication

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.11 or higher recommended, minimum v3.8)
- npm (Node package manager)
- pip (Python package manager)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/JeyHightower/Harmonic-Universe.git
cd Harmonic-Universe
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

3. Install backend dependencies:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

4. Set up environment variables:

Create a `.env` file in the backend directory with the following variables:

```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///app.db
CORS_ORIGINS=http://localhost:5173
```

Create a `.env` file in the frontend directory with:

```env
VITE_API_BASE_URL=http://localhost:5001
```

## Development

To run both frontend and backend servers in development mode:

### Backend:

```bash
cd backend
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
python app.py
```

The backend will run on http://localhost:5001

### Frontend:

```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:5173

## API Documentation

The application provides a RESTful API for interacting with universes, scenes, characters, and notes. For detailed API documentation, see:

- [API Documentation](docs/api/README.md) - Primary API reference
- [Physics API](docs/frontend/api/PHYSICS_API.md) - Physics-related API endpoints
- [WebSocket Protocol](docs/frontend/api/WEBSOCKET_PROTOCOL.md) - Real-time communication

## Production Deployment

The application is configured for deployment on Render.com using the provided scripts:

- `render-build.sh`: Builds both frontend and backend for production
- `render-start.sh`: Starts the production application
- `render.yaml`: Blueprint configuration for automated deployment

### Deployment Options:

#### 1. Blueprint Deployment (Recommended)

Use Render.com's Blueprint feature to deploy the entire stack with a single click:

1. Connect your repository to Render
2. Select "Blueprint" deployment
3. Let Render create all necessary services based on the `render.yaml` configuration

#### 2. Manual Deployment

1. Push your code to a Git repository
2. Create a new Web Service on Render
3. Connect to your repository
4. Set build command to `./render-build.sh`
5. Set start command to `./render-start.sh`
6. Add necessary environment variables (see `docs/RENDER_DEPLOYMENT.md`)

See `docs/RENDER_DEPLOYMENT.md` for more detailed deployment instructions.

## Project Structure

```
harmonic-universe/
├── frontend/           # React frontend
│   ├── src/            # Source files
│   │   ├── components/ # React components
│   │   ├── features/   # Feature components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Redux store
│   │   ├── services/   # API services
│   │   └── utils/      # Utility functions
│   ├── public/         # Static files
│   └── package.json    # Frontend dependencies
├── backend/            # Flask backend
│   ├── app/            # Application code
│   │   ├── api/        # API routes
│   │   ├── models/     # Database models
│   │   └── utils/      # Utility functions
│   ├── migrations/     # Database migrations
│   └── requirements.txt # Backend dependencies
├── docs/               # Documentation
├── render-build.sh     # Render.com build script
├── render-start.sh     # Render.com start script
├── render.yaml         # Render.com blueprint configuration
└── README.md           # Project documentation
```

## Troubleshooting

For common issues and their solutions, see `docs/FIXES-README.md`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
